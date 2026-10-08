# Authentification & Gestion des Rôles

## 1. Principes d'Authentification

L'authentification s'appuie sur Supabase Auth couplé à la table applicative `profiles` et `restaurant_users`.

### Rôles pris en charge :
1. `MANAGER` : Accès d'administration globale au restaurant.
2. `SERVER` : Accès opérationnel dédié au service en salle.
3. `CLIENT` : Accès session QR tokenisé par l'URL de table `/table/:restaurantId/:tableId`.

## 2. Découpage des flux de connexion

- **Gérant** :
  - Page de connexion : `/manager/login` (ou interface switcher de rôle)
  - Identifiants de démo : `manager@demolounge.tn` / `MANAGER_01`
  - Redirection automatique vers `/manager/dashboard`

- **Serveurs** :
  - Page de connexion : `/server/login`
  - Identifiants de démo :
    - Serveur 1 : username `U873` (Karim)
    - Serveur 2 : username `U874` (Sarra)
  - Redirection automatique vers `/server/dashboard`
  - Filtre par défaut sur les tables assignées.

- **Clients** :
  - Aucun mot de passe requis.
  - Le scan du QR code injecte les paramètres du restaurant et de la table.
  - La session active est rattachée à la table en base de données.
