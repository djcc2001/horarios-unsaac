# 🎓 UNSAAC Horarios

> Consulta tu horario semanal y cursos matriculados de forma rápida y visual.

**🔗 Demo en vivo:** [https://horarios-unsaac.onrender.com](https://horarios-unsaac.onrender.com)

---

## ✨ Características

- 🔍 Búsqueda por código de alumno y carrera
- 📅 Visualización de horario semanal con colores por curso
- ⚠️ Detección automática de cruces de horario
- 📱 Diseño responsive — funciona en móvil y escritorio
- ⚡ Consulta paralela para resultados rápidos

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Backend | Python · FastAPI · Uvicorn |
| Frontend | HTML · CSS · JavaScript |
| Deploy | Render.com |
| Datos | API pública del Centro de Cómputo UNSAAC |

---

## 🚀 Correr localmente

**Requisitos:** Python 3.10+

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/unsaac-horarios.git
cd unsaac-horarios

# 2. Crear entorno virtual e instalar dependencias
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Correr el servidor
uvicorn backend.main:app --reload

# 4. Abrir en el navegador
# http://127.0.0.1:8000
```

---

## 📁 Estructura

```
unsaac-horarios/
├── backend/
│   ├── main.py          # API FastAPI
│   └── scraper.py       # Lógica de consulta
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── requirements.txt
└── Procfile
```

---

## ⚠️ Aviso Legal / Disclaimer

Este proyecto es de **uso estrictamente educativo y personal**. Fue desarrollado con fines de aprendizaje en ingeniería de software, consumo de APIs REST y desarrollo web.

- Este sistema **no está afiliado, endorsado ni relacionado oficialmente** con la Universidad Nacional de San Antonio Abad del Cusco (UNSAAC) ni con su Centro de Cómputo.
- Los datos mostrados provienen de la **API pública** del sistema de intranet de alumnos de la UNSAAC, accesible sin autenticación desde la red universitaria.
- **No se almacena, procesa ni comparte ningún dato personal** de los estudiantes. Toda consulta es directa entre el usuario y la API institucional.
- El uso de esta herramienta es **responsabilidad exclusiva del usuario**. El desarrollador no se hace responsable por el uso indebido del sistema.
- Si eres parte de la UNSAAC y consideras que este proyecto infringe alguna política institucional, por favor abre un [issue](../../issues) o contáctame directamente para coordinar la solución.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT** — libre para usar, modificar y distribuir con atribución.

> *"Construido con fines educativos para la comunidad estudiantil de la UNSAAC."*