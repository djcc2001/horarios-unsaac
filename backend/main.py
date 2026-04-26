from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend import scraper

app = FastAPI(title="UNSAAC Horarios")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent  # apunta a CURSOS_ALUMNO/

@app.get("/api/semestre")
def semestre_activo():
    try:
        return {"semestre": scraper.get_semestre_activo()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/carreras")
def carreras():
    try:
        return scraper.get_carreras()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/buscar/{codigo_alumno}/{carrera}")
def buscar(codigo_alumno: str, carrera: str, semestre: str = None):
    try:
        if not semestre:
            semestre = scraper.get_semestre_activo()
        resultado = scraper.buscar_alumno(codigo_alumno, carrera, semestre)
        if not resultado["alumno"]:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/", StaticFiles(directory=str(BASE_DIR / "frontend"), html=True), name="frontend")