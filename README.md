# 📊 HabitTracker

**Suivez vos habitudes quotidiennes, partagez vos progrès avec vos amis et restez motivé.**

HabitTracker est une application web progressive (PWA) de suivi d'habitudes qui vous permet de créer des routines personnalisées, suivre vos progrès et vous motiver entre amis.

## ✨ Fonctionnalités

### 📝 Gestion des habitudes
- Création de catégories personnalisées (Matin, Journée, Soir, Hebdo, Addiction)
- Habitudes quotidiennes ou hebdomadaires
- Interface intuitive style tableur pour cocher vos habitudes
- Navigation par semaine avec historique complet

### 📈 Statistiques détaillées
- Pourcentage de complétion par jour, semaine, mois, année
- Statistiques par habitude et par catégorie
- Période personnalisée pour des analyses spécifiques
- Visualisation des progrès avec barres de progression

### 🃏 Système de Jokers
- Configurez un nombre de jokers par période (semaine/mois/année)
- Utilisez un joker pour les jours où vous ne pouvez vraiment pas (maladie, voyage...)
- Les jokers excluent le jour des statistiques (363/363 au lieu de 365)
- Clic droit (PC) ou mode joker (mobile) pour activer

### 👥 Système d'amis
- Recherche d'utilisateurs par pseudo
- Envoi et réception de demandes d'amis
- Notifications de demandes en attente
- Consultation du tracker de vos amis (lecture seule)

### 📱 PWA (Progressive Web App)
- Installation sur mobile et desktop
- Fonctionne hors ligne
- Notifications push (à venir)
- Interface responsive

## 🛠️ Technologies utilisées

| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 14.x | Framework React avec App Router |
| **React** | 19.x | Bibliothèque UI |
| **TypeScript** | 5.x | Typage statique |
| **Prisma** | 6.x | ORM pour base de données |
| **SQLite/PostgreSQL/MySQL** | - | Base de données (au choix) |
| **TailwindCSS** | 3.x | Styles utilitaires |
| **bcryptjs** | - | Hashage sécurisé des mots de passe |

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou pnpm

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/habittracker.git
cd habittracker
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp env.example .env
```

4. **Configurer la base de données**

Éditez le fichier `.env` selon votre choix de base de données :

| Base de données | Provider Prisma | Exemple DATABASE_URL |
|-----------------|-----------------|----------------------|
| **SQLite** (défaut) | `sqlite` | `file:./dev.db` |
| **PostgreSQL** | `postgresql` | `postgresql://user:pass@localhost:5432/habittracker` |
| **MySQL** | `mysql` | `mysql://user:pass@localhost:3306/habittracker` |
| **MariaDB** | `mysql` | `mysql://user:pass@localhost:3306/habittracker` |

> ⚠️ **Important** : Si vous utilisez autre chose que SQLite, modifiez aussi le `provider` dans `prisma/schema.prisma`

**Exemple pour PostgreSQL :**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // Changer "sqlite" en "postgresql"
  url      = env("DATABASE_URL")
}
```

5. **Initialiser la base de données**
```bash
npm run db:push
```

6. **Lancer le serveur de développement**
```bash
npm run dev
```

7. **Ouvrir l'application**
```
http://localhost:3000
```

### Services cloud recommandés

| Service | Base de données | Plan gratuit |
|---------|-----------------|--------------|
| [Supabase](https://supabase.com) | PostgreSQL | ✅ 500 MB |
| [PlanetScale](https://planetscale.com) | MySQL | ✅ 5 GB |
| [Railway](https://railway.app) | PostgreSQL/MySQL | ✅ $5 crédit |
| [Neon](https://neon.tech) | PostgreSQL | ✅ 512 MB |

## 📜 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile l'application pour la production |
| `npm run start` | Lance le serveur de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run db:push` | Synchronise le schéma Prisma avec la base |
| `npm run db:studio` | Ouvre Prisma Studio (interface BDD) |

## 📁 Structure du projet

```
habittracker/
├── prisma/
│   └── schema.prisma      # Schéma de la base de données
├── env.example            # Variables d'environnement (template)
├── public/
│   ├── icons/             # Icônes PWA
│   ├── manifest.json      # Manifest PWA
│   └── sw.js              # Service Worker
├── src/
│   ├── app/
│   │   ├── api/           # Routes API
│   │   │   ├── auth/      # Authentification
│   │   │   ├── categories/
│   │   │   ├── friends/
│   │   │   ├── habits/
│   │   │   ├── jokers/
│   │   │   └── user/
│   │   ├── components/    # Composants React
│   │   ├── context/       # Contextes (Auth)
│   │   ├── friends/       # Page amis
│   │   ├── login/         # Page connexion
│   │   ├── register/      # Page inscription
│   │   ├── settings/      # Page paramètres
│   │   ├── tracker/       # Page tracker ami
│   │   ├── globals.css    # Styles globaux
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Dashboard principal
│   └── lib/
│       └── prisma.ts      # Client Prisma
└── package.json
```

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (10 rounds)
- Validation côté client et serveur
- Minimum 6 caractères pour les mots de passe
- Protection des routes API

## 🌐 Déploiement

### Vercel (recommandé)
1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez !

### Autres plateformes
L'application peut être déployée sur n'importe quelle plateforme supportant Node.js :
- Railway
- Render
- Fly.io
- VPS avec PM2

## 📝 Roadmap

- [ ] Notifications push
- [ ] Mode sombre/clair
- [ ] Export des données (CSV/JSON)
- [ ] Graphiques avancés
- [ ] Rappels personnalisés
- [ ] API publique

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

Fait avec ❤️ pour vous aider à atteindre vos objectifs.

