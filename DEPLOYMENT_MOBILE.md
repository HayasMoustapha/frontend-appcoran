# Accès Mobile (Android / iPhone) — Guide ultra simple

Objectif : ouvrir **appcoran** sur le téléphone, **avec les données du backend**.

## 0) Comprendre le problème (en mots simples)
- Le téléphone doit trouver **le backend**.
- Si l’adresse du backend n’est pas correcte, **aucune donnée** ne s’affiche.
- Garder le domaine `appcoran.com` demande un **DNS local** (routeur ou DNS manuel).

## 1) Prérequis indispensables
- Le **PC** et le **téléphone** sont sur **le même Wi‑Fi**.
- Le backend tourne et répond :
```bash
curl -i http://192.168.1.179:4000/health
```
- Le frontend tourne (dev ou prod).

## 2) Option la plus simple (sans domaine)
Cette option marche **toujours**, mais on n’utilise pas `appcoran.com`.

### Étapes
1) Dans `.env` du frontend :
```
VITE_API_BASE_URL=http://192.168.1.179:4000
VITE_PUBLIC_APP_URL=http://192.168.1.179:5173
VITE_PUBLIC_BASE_URL=http://192.168.1.179:4000
```
2) Lancer le frontend :
```bash
npm run dev -- --host 0.0.0.0
```
3) Sur le téléphone, ouvrir :
```
http://192.168.1.179:5173
```

**Résultat attendu :** l’app s’ouvre et les récitations apparaissent.

---

## 3) Option recommandée (garder appcoran.com)
Pour garder `appcoran.com` et `api.appcoran.com`, il faut un **DNS local**.

### A) Si votre routeur supporte le DNS local (idéal)
1) Ouvrir l’interface du routeur.
2) Créer 2 entrées DNS locales :
   - `appcoran.com` → IP du PC (ex. : `192.168.1.179`)
   - `api.appcoran.com` → IP du PC
3) Sur le téléphone, laisser le DNS en **Automatique**.
4) Ouvrir :
```
http://appcoran.com
```

**Résultat attendu :** le domaine fonctionne sans configuration sur le téléphone.

### B) Si le routeur ne supporte pas le DNS local
Vous allez forcer le DNS **dans le téléphone** (manuel).

#### Android
1) Wi‑Fi → Modifier → Options avancées
2) DNS 1 : `192.168.1.179`
3) DNS 2 : (laisser vide)

#### iPhone
1) Wi‑Fi → (i) → Configurer DNS → Manuel
2) Ajouter : `192.168.1.179`

#### Vérifier
Ouvrez dans le navigateur :
- `http://api.appcoran.com/health`
- `http://appcoran.com`

**Résultat attendu :** `/health` renvoie `{"status":"ok"}`.

---

## 4) iPhone : stabilité des styles (important)
Le mode **dev** de Vite peut faire disparaître le style sur iOS.
Solution : utiliser le **build de production**.

### Étapes
1) Build :
```bash
npm run build
```
2) Lancer Caddy :
```bash
caddy run --config /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/Caddyfile.local.prod
```
3) Ouvrir :
```
http://appcoran.com
```

**Résultat attendu :** le style reste stable même après rechargement.

---

## 5) Outil pratique : QR code Wi‑Fi (optionnel)
Un script peut créer un QR code avec le Wi‑Fi + DNS.
```bash
python3 /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/generate_wifi_qr.py \
  --ssid "ISCAI 4G" \
  --password "VOTRE_MOT_DE_PASSE_WIFI" \
  --dns "192.168.1.179"
```
Le QR est créé ici : `frontend-appcoran/deploy/wifi-setup.png`

---

## 6) Dépannage simple
- **Pas de données** : vérifiez `VITE_API_BASE_URL` + backend actif.
- **Domaine ne fonctionne pas** : DNS mal configuré.
- **iPhone sans style** : utilisez build + Caddy.
- **Changement .env** : relancez le frontend.
