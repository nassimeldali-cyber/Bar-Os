# Guide d'Installation & Configuration (SETUP)

## 1. Prérequis
- Node.js version 18+ ou 20+
- Un projet Supabase (Cloud ou local via Supabase CLI) OU l'émulateur backend persistant embarqué.

## 2. Déploiement des Migrations SQL sur Supabase
Si vous utilisez un projet Supabase distant :
1. Rendez-vous dans la console Supabase du projet > **SQL Editor**.
2. Exécutez dans l'ordre les scripts du dossier `supabase/migrations/` :
   - `20261008000001_initial_schema.sql`
   - `20261008000002_rls_policies.sql`
   - `20261008000003_functions_triggers.sql`
   - `20261008000004_seed_data.sql`
3. Vérifiez que la publication temps réel `supabase_realtime` est active pour les tables `tables`, `table_sessions`, `orders`, `notifications`.

## 3. Variables d'Environnement
Dans votre fichier `.env` ou sur AI Studio :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

## 4. Démarrage de l'Application
```bash
npm install
npm run dev
```
L'application démarre sur `http://localhost:3000`.
