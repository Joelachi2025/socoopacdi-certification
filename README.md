# SOCOOPACDI COOP-CA – Certification RA 2020

## Déployer sur Netlify (méthode la plus simple : glisser-déposer)

1. Décompressez ce dossier sur votre ordinateur.
2. Ouvrez un terminal dans ce dossier et lancez :
   ```
   npm install
   npm run build
   ```
   Cela crée un dossier `dist/` contenant le site prêt à déployer.
3. Allez sur https://app.netlify.com
4. Faites glisser le dossier `dist/` directement sur la page d'accueil Netlify ("Drag and drop your site output folder here")
5. C'est en ligne en quelques secondes !

## Méthode recommandée (mises à jour automatiques) : via GitHub

1. Créez un dépôt sur https://github.com (gratuit) et uploadez tous ces fichiers.
2. Sur Netlify : "Add new site" → "Import an existing project" → connectez votre compte GitHub → choisissez le dépôt.
3. Netlify détecte automatiquement la configuration (`netlify.toml`) :
   - Build command : `npm run build`
   - Publish directory : `dist`
4. Cliquez "Deploy".

Avec cette méthode, chaque fois que vous (ou moi) modifions le code et le poussons sur GitHub, le site se met à jour automatiquement.

## Remplacer votre site Netlify existant

Si vous avez déjà un site Netlify (lustrous-blini-b4e2d0.netlify.app), allez dans ce site sur Netlify → **Site configuration → Build & deploy**, et changez la source pour pointer vers ce nouveau dépôt/dossier. Ou plus simple : supprimez l'ancien déploiement et déployez ce nouveau dossier au même endroit.
