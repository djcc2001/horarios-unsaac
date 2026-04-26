import requests
import xml.etree.ElementTree as ET
import urllib3
from concurrent.futures import ThreadPoolExecutor, as_completed

urllib3.disable_warnings()

BASE  = "https://intranetalumnos.unsaac.edu.pe:8500/api"
DIAS  = {"LU": "Lunes", "MA": "Martes", "MI": "Miércoles", "JU": "Jueves", "VI": "Viernes", "SA": "Sábado"}
TIPOS = {"T": "Teoría", "L": "Lab", "P": "Práctica"}

def get_data(url):
    r = requests.get(url, verify=False, timeout=10)
    r.raise_for_status()
    content_type = r.headers.get("Content-Type", "")
    if "json" in content_type:
        return r.json()
    elif "xml" in content_type:
        return ET.fromstring(r.content)
    else:
        return r.text.strip()

def get_semestre_activo():
    data = get_data(f"{BASE}/Semestre/SemestreActivo/")
    return data["semestre"]

def get_carreras():
    data = get_data(f"{BASE}/Carrera/ListaCarreras/")
    carreras = []
    for item in data:
        carreras.append({
            "cp":     item.get("cp"),
            "nombre": item.get("nombre"),
        })
    return carreras

def get_cursos_unicos(carrera, semestre):
    data = get_data(f"{BASE}/Catalogo/CatalogoHorario/{carrera}/{semestre}/0")
    vistos = set()
    cursos = []
    for item in data:
        curso   = item.get("curso")
        grupo   = item.get("grupo")
        cp      = item.get("cp")
        nombre  = item.get("nombre")
        dia     = item.get("dia")
        hora    = item.get("hora")
        horaFin = item.get("horaFin")
        aula    = item.get("aula")
        docente = item.get("nombreDocente")
        tipo    = item.get("tipoDictado")

        if curso and grupo and cp:
            cod_asignatura = f"{curso}{grupo}{cp}"
            entrada = next((c for c in cursos if c["cod_asignatura"] == cod_asignatura), None)
            if not entrada:
                entrada = {
                    "cod_asignatura": cod_asignatura,
                    "nombre":  nombre,
                    "docente": docente,
                    "horarios": []
                }
                cursos.append(entrada)
                vistos.add(cod_asignatura)
            if dia and hora and horaFin:
                entrada["horarios"].append({
                    "dia":  DIAS.get(dia, dia),
                    "hora": f"{hora}:00 - {horaFin}:00",
                    "aula": aula or "?",
                    "tipo": TIPOS.get(tipo, tipo or "?")
                })
    return cursos

def buscar_en_curso(cod_asignatura, semestre, codigo_alumno):
    try:
        data = get_data(f"{BASE}/Curso/Matriculados/{cod_asignatura}/{semestre}")
        for item in data:
            if str(item.get("alumno")) == codigo_alumno:
                return item.get("nombre")
    except Exception:
        pass
    return None

def buscar_alumno(codigo_alumno, carrera, semestre):
    cursos = get_cursos_unicos(carrera, semestre)
    nombre_alumno    = ""
    cursos_encontrados = []

    def buscar(curso):
        nombre = buscar_en_curso(curso["cod_asignatura"], semestre, codigo_alumno)
        if nombre:
            return nombre, curso
        return None, None

    with ThreadPoolExecutor(max_workers=20) as executor:
        futuros = {executor.submit(buscar, curso): curso for curso in cursos}
        for futuro in as_completed(futuros):
            nombre, curso = futuro.result()
            if nombre:
                nombre_alumno = nombre
                cursos_encontrados.append(curso)

    return {
        "alumno":   nombre_alumno,
        "semestre": semestre,
        "cursos":   cursos_encontrados
    }