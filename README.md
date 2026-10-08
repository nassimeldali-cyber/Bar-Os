# BarLounge SaaS — Gestion Digitale pour Bars, Cafés & Lounges

Plateforme SaaS complète et opérationnelle pour la commande client sur smartphone par QR Code, la gestion de sessions de table, le suivi de service en salle et la transmission à la caisse physique.

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm run dev
```
L'application est servie sur `http://localhost:3000`.

---

## 👥 Comptes & Accès de Démonstration

L'application est pré-initialisée avec l'établissement **Demo Lounge & Bar** (Monnaie : **TND**) :

| Rôle | Identifiant / Email | Nom | Affectation |
| :--- | :--- | :--- | :--- |
| **Gérant (Manager)** | `MANAGER_01` ou `manager@demolounge.tn` | Yassine Gérant | Supervision globale |
| **Serveur 1** | `U873` ou `u873@demolounge.tn` | Karim Serveur | Tables 01, 02, 03, 08 |
| **Serveur 2** | `U874` ou `u874@demolounge.tn` | Sarra Serveuse | Tables 04, 05, 06, 07, 09, 10 |
| **Client** | Aucun compte requis | Scan QR Code | Accès direct `/table/:restaurantId/:tableId` |

---

## 📱 Scénario Complet de Démonstration

1. **Gérant** : Connectez-vous sur `/manager`. Visualisez les KPIs, les tables et le menu.
2. **QR Code** : Dans l'onglet *Tables*, cliquez sur l'icône QR de la Table **01** (ou **08**).
3. **Client** : Ouvrez la vue client de la table.
   - Parcourez les catégories (Cocktails, Tapas, Softs...).
   - Ajoutez des articles au panier et passez la **Commande #1**.
   - Notez que la table passe immédiatement à l'état **OCCUPÉE**.
4. **Serveur** : Connectez-vous sur `/server` en tant que `U873`.
   - La commande apparaît en direct avec signal sonore et visuel.
   - Cliquez sur **"Transmise à la caisse"** (enregistre l'heure et l'auteur).
   - Passez la commande à **"Prête"** puis **"Servie"**.
5. **Client (Deuxième tournée)** : Repassez une commande sur la même table (ex: 2 boissons). Le total de la session s'additionne en temps réel.
6. **Demande d'addition** : Le client clique sur **"Demander l'addition"**.
   - La session passe à `ADDITION_REQUESTED`.
   - Le serveur reçoit l'alerte avec le montant exact.
7. **Paiement & Clôture** :
   - Le serveur clique sur **"Encaisser"**, sélectionne **Espèces** ou **TPE** et valide.
   - La session est clôturée (`CLOSED`).
   - La table redevient immédiatement **LIBRE** (`AVAILABLE`).
   - Un nouveau scan ouvrira une session vierge.

---

## 🗄️ Base de Données & Migrations Supabase
Toutes les migrations SQL reproductibles se trouvent dans `supabase/migrations/` :
- `20261008000001_initial_schema.sql` : Tables, contraintes, index et types énumérés.
- `20261008000002_rls_policies.sql` : Politiques Row Level Security.
- `20261008000003_functions_triggers.sql` : Triggers de synchronisation et total automatique.
- `20261008000004_seed_data.sql` : Données initiales du Demo Lounge.

---

## 🧪 Tests Automatisés
Les 15 tests critiques (Section 31 du cahier des charges) sont exécutables directement depuis l'interface Manager > onglet **"Tests & Diagnostics"**.
