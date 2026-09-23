# Base de données Lucius Budget

## Installation

1. Ouvrir le Dashboard Supabase du projet.
2. Aller dans **SQL Editor** > **New query**.
3. Copier-coller le contenu de [`schema.sql`](./schema.sql) et exécuter (bouton **Run**).
4. Vérifier dans **Table Editor** que la table `luciusbudget_entries` est bien créée.
5. Vérifier dans **Authentication > Policies** que les 4 policies RLS sont actives sur `luciusbudget_entries`.

## Table `luciusbudget_entries`

| Colonne      | Type          | Détails                                                                 |
|--------------|---------------|--------------------------------------------------------------------------|
| `id`         | `uuid`        | Clé primaire, générée automatiquement (`gen_random_uuid()`)             |
| `date`       | `timestamptz` | Défaut `now()`. Plafonnée à la fin du mois en cours (trigger, voir plus bas) |
| `category`   | `varchar(16)` | Catégorie (liste fixe gérée côté frontend, `src/lib/categories.js`)      |
| `label`      | `varchar(32)` | Étiquette libre                                                          |
| `amount`     | `numeric(10,2)` | Montant, toujours >= 0                                                 |
| `is_income`  | `boolean`     | Défaut `false`. `true` = revenu, `false` = dépense                      |
| `author`     | `uuid`        | Référence `auth.users(id)`, non visible/éditable dans le formulaire     |
| `created_at` | `timestamptz` | Horodatage de création (traçabilité, non affiché dans l'UI)             |

## `luciusbudget_users` ?

Pas de table dédiée : on utilise directement `auth.users`, la table native de
Supabase Auth. La colonne `author` de `luciusbudget_entries` y fait référence
via une clé étrangère (`references auth.users(id)`).

## Pourquoi un trigger et pas un simple `CHECK` pour la date ?

PostgreSQL interdit d'utiliser des fonctions non-immuables (comme `now()`)
dans une contrainte `CHECK`. La fonction `luciusbudget_clamp_entry_date()`
s'exécute donc en `BEFORE INSERT OR UPDATE` et **plafonne automatiquement**
toute date envoyée au-delà de la fin du mois en cours (au lieu de rejeter la
requête), ce qui correspond au comportement demandé ("maximum la fin du mois
en cours").

## Sécurité (RLS)

Row Level Security est activé avec 4 policies : un utilisateur connecté ne
peut lire, insérer, modifier ou supprimer que les lignes où `author = auth.uid()`.
L'insertion via l'API devra donc toujours envoyer `author = <uid de l'utilisateur connecté>`.
