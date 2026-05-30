:: 1. CRÉATION DES REPERTOIRES ARCHITECTURAUX DU DOSSIER CORE ET SHARED
mkdir src\app\core\guards
mkdir src\app\core\interceptors
mkdir src\app\core\models
mkdir src\app\core\services
mkdir src\app\shared\components\notification-center
mkdir src\app\shared\components\company-card-modal

:: 2. CRÉATION DES REPERTOIRES POUR CHAQUE PAGE ET FONCTIONNALITÉ (FEATURES)
mkdir src\app\features\auth\login
mkdir src\app\features\auth\register
mkdir src\app\features\admin\admin-layout
mkdir src\app\features\admin\admin-overview
mkdir src\app\features\admin\manage-users
mkdir src\app\features\admin\manage-jobs
mkdir src\app\features\candidate\candidate-layout
mkdir frontend\src\app\features\candidate\profile-settings
mkdir src\app\features\candidate\cv-builder
mkdir src\app\features\candidate\cv-view
mkdir src\app\features\candidate\job-search
mkdir src\app\features\candidate\job-apply-modal
mkdir src\app\features\candidate\applications-list
mkdir src\app\features\recruiter\recruiter-layout
mkdir src\app\features\recruiter\profile-settings
mkdir src\app\features\recruiter\recruiter-overview
mkdir src\app\features\recruiter\job-create
mkdir src\app\features\recruiter\job-manage
mkdir src\app\features\recruiter\ats-pipeline

:: 3. GÉNÉRATION DES FICHIERS TECHNIQUES (GUARDS, INTERCEPTORS, SERVICES, MODELS)
echo. > src\app\core\guards\admin.guard.ts
echo. > src\app\core\guards\candidate.guard.ts
echo. > src\app\core\guards\recruiter.guard.ts
echo. > src\app\core\interceptors\jwt.interceptor.ts
echo. > src\app\core\models\user.model.ts
echo. > src\app\core\models\job.model.ts
echo. > src\app\core\models\application.model.ts
echo. > src\app\core\services\auth.service.ts
echo. > src\app\core\services\job.service.ts
echo. > src\app\core\services\application.service.ts
echo. > src\app\core\services\notification.service.ts
echo. > src\app\app.config.ts
echo. > src\app\app.routes.ts

:: 4. ENVOI DES TRIPLETS DE FICHIERS (.component.ts, .component.html, .component.css)
:: Espace Authentification Commune
echo. > src\app\features\auth\login\login.component.ts
echo. > src\app\features\auth\login\login.component.html
echo. > src\app\features\auth\login\login.component.css
echo. > src\app\features\auth\register\register.component.ts
echo. > src\app\features\auth\register\register.component.html
echo. > src\app\features\auth\register\register.component.css

:: Espace Administrateur (Gestion Globale)
echo. > src\app\features\admin\admin-layout\admin-layout.component.ts
echo. > src\app\features\admin\admin-layout\admin-layout.component.html
echo. > src\app\features\admin\admin-layout\admin-layout.component.css
echo. > src\app\features\admin\admin-overview\admin-overview.component.ts
echo. > src\app\features\admin\admin-overview\admin-overview.component.html
echo. > src\app\features\admin\admin-overview\admin-overview.component.css
echo. > src\app\features\admin\manage-users\manage-users.component.ts
echo. > src\app\features\admin\manage-users\manage-users.component.html
echo. > src\app\features\admin\manage-users\manage-users.component.css
echo. > src\app\features\admin\manage-jobs\manage-jobs.component.ts
echo. > src\app\features\admin\manage-jobs\manage-jobs.component.html
echo. > src\app\features\admin\manage-jobs\manage-jobs.component.css

:: Espace Candidat (Recherche, Profil & CV)
echo. > src\app\features\candidate\candidate-layout\candidate-layout.component.ts
echo. > src\app\features\candidate\candidate-layout\candidate-layout.component.html
echo. > src\app\features\candidate\candidate-layout\candidate-layout.component.css
echo. > src\app\features\candidate\profile-settings\profile-settings.component.ts
echo. > src\app\features\candidate\profile-settings\profile-settings.component.html
echo. > src\app\features\candidate\profile-settings\profile-settings.component.css
echo. > src\app\features\candidate\cv-builder\cv-builder.component.ts
echo. > src\app\features\candidate\cv-builder\cv-builder.component.html
echo. > src\app\features\candidate\cv-builder\cv-builder.component.css
echo. > src\app\features\candidate\cv-view\cv-view.component.ts
echo. > src\app\features\candidate\cv-view\cv-view.component.html
echo. > src\app\features\candidate\cv-view\cv-view.component.css
echo. > src\app\features\candidate\job-search\job-search.component.ts
echo. > src\app\features\candidate\job-search\job-search.component.html
echo. > src\app\features\candidate\job-search\job-search.component.css
echo. > src\app\features\candidate\job-apply-modal\job-apply-modal.component.ts
echo. > src\app\features\candidate\job-apply-modal\job-apply-modal.component.html
echo. > src\app\features\candidate\job-apply-modal\job-apply-modal.component.css
echo. > src\app\features\candidate\applications-list\applications-list.component.ts
echo. > src\app\features\candidate\applications-list\applications-list.component.html
echo. > src\app\features\candidate\applications-list\applications-list.component.css

:: Espace Recruteur (ATS, Gestion des Offres & Profil)
echo. > src\app\features\recruiter\recruiter-layout\recruiter-layout.component.ts
echo. > src\app\features\recruiter\recruiter-layout\recruiter-layout.component.html
echo. > src\app\features\recruiter\recruiter-layout\recruiter-layout.component.css
echo. > src\app\features\recruiter\profile-settings\profile-settings.component.ts
echo. > src\app\features\recruiter\profile-settings\profile-settings.component.html
echo. > src\app\features\recruiter\profile-settings\profile-settings.component.css
echo. > src\app\features\recruiter\recruiter-overview\recruiter-overview.component.ts
echo. > src\app\features\recruiter\recruiter-overview\recruiter-overview.component.html
echo. > src\app\features\recruiter\recruiter-overview\recruiter-overview.component.css
echo. > src\app\features\recruiter\job-create\job-create.component.ts
echo. > src\app\features\recruiter\job-create\job-create.component.html
echo. > src\app\features\recruiter\job-create\job-create.component.css
echo. > src\app\features\recruiter\job-manage\job-manage.component.ts
echo. > src\app\features\recruiter\job-manage\job-manage.component.html
echo. > src\app\features\recruiter\job-manage\job-manage.component.css
echo. > src\app\features\recruiter\ats-pipeline\ats-pipeline.component.ts
echo. > src\app\features\recruiter\ats-pipeline\ats-pipeline.component.html
echo. > src\app\features\recruiter\ats-pipeline\ats-pipeline.component.css

:: Composants Communs Partagés
echo. > src\app\shared\components\notification-center\notification-center.component.ts
echo. > src\app\shared\components\notification-center\notification-center.component.html
echo. > src\app\shared\components\notification-center\notification-center.component.css
echo. > src\app\shared\components\company-card-modal\company-card-modal.component.ts
echo. > src\app\shared\components\company-card-modal\company-card-modal.component.html
echo. > src\app\shared\components\company-card-modal\company-card-modal.component.css
