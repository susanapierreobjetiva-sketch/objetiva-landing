#!/usr/bin/env python3
CSS_PATH = "./css/style.css"

old = """.header-page {
  position: relative;
  background: #000000;
  padding: 28px 5.7%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}"""

new = """.header-page {
  position: relative;
  background: #000000;
  padding: 28px 32px;
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}"""

with open(CSS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

assert content.count(old) == 1, f"Encontradas {content.count(old)} coincidencias, se esperaba 1"

content = content.replace(old, new)

with open(CSS_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: .header-page actualizado")
