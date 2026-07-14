run backend:
* cd cosmetics-site/backend
* uvicorn main:app --reload

http://127.0.0.1:8000/    (products, site)

run frontend:
* cd cosmetics-site/frontend
* python -m http.server 5500

http://127.0.05500/   (index.html, admin.html)


Your setup right now
* FastAPI backend → port 8000
* Frontend static site → port 5500


reset admin pw:
* export ADMIN_USERNAME="admin"
* export ADMIN_PASSWORD="xxPxxxxx"
* export JWT_SECRET="xxxxx"


pending task 
* The products photo should be crop better
* arrange the products in other
* markdown for about body and Hero note
* upload correct photos and write-up
* update contact us
* better admin UI (optional)