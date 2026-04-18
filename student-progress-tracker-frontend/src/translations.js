export const REQUIREMENTS_LABELS = {
  tableHeaders: {
    hu: ["Kategória", "Teljesített", "Szükséges", "Hiányzik"],
    en: ["Category", "Completed", "Required", "Missing"]
  },
  sectionTitles: {
    hu: {
      total: "Összes kredit",
      required: "Kötelező",
      elective: "Kötelezően választható",
      optional: "Szabadon választható",
      pe: "Testnevelés félévek",
      practice: "Szakmai gyakorlat"
    },
    en: {
      total: "Total credits",
      required: "Required",
      elective: "Elective",
      optional: "Optional",
      pe: "PE semesters",
      practice: "Professional practice"
    }
  },
  courseListTitles: {
    hu: {
      required: "Kötelező tárgyak – elérhető kurzusok",
      core: "Kötelezően választható – Törzsanyag (minimum 80 kredit informatikai törzsanyaggal együtt)",
      info_core: "Kötelezően választható – Törzsanyag informatikai (minimum 14 kredit)",
      non_core: "Kötelezően választható – Nem törzsanyag (Minimum 36 kredit)",
      optional: "Szabadon választható – elérhető kurzusok (minimum 10 kredit)",
      pe: "Testnevelés – elérhető kurzusok (minimum 2 félév)",
      practice: "Szakmai gyakorlat – elérhető kurzusok (minimum 320 óra)",
      thesis1: "Szakdolgozat 1 – elérhető kurzusok",
      thesis2: "Szakdolgozat 2 – elérhető kurzusok"
    },
    en: {
      required: "Required subjects – available courses",
      core: "Elective – Core (min. 80 credits including IT core)",
      info_core: "Elective – IT core (min. 14 credits)",
      non_core: "Elective – Non-core (min. 36 credits)",
      optional: "Optional – available courses (min. 10 credits)",
      pe: "PE – available courses (min. 2 semesters)",
      practice: "Professional practice – available courses (min. 320 hours)",
      thesis1: "Thesis 1 – available courses",
      thesis2: "Thesis 2 – available courses"
    }
  }
};

export const PROGRESS_LABELS = {
  hu: {
    title: "Progress feltöltés sablonnal",
    searchPlaceholder: "Keresés név / neptun (uid) / email...",
    downloadTemplate: "Sablon letöltése",
    downloading: "Letöltés…",
    clearSelection: "Kijelölés törlése",
    dropHint: "Húzd ide a kitöltött sablont (.xlsx / .csv), vagy kattints a tallózáshoz",
    dropSubSelected: "Kiválasztott felhasználóhoz töltsd fel a sablont.",
    dropSubNoSelect: "Előbb válassz felhasználót a táblából.",
    fileAssignedTo: "A fájl ehhez a felhasználóhoz ({id}) van rendelve.",
    fileAssignedOther: "A fájl jelenleg a {id} felhasználóhoz van rendelve.",
    assignToSelected: "Hozzárendelés a kiválasztotthoz",
    removeFile: "Töröl",
    upload: "Feltöltés",
    uploading: "Feltöltés…",
    cancel: "Mégse",
    chooseUser: "Válassz felhasználót!",
    chooseFile: "Válassz fájlt a feltöltéshez!",
    uploadSuccess: "Feltöltés sikeres",
    uploadFailed: "Feltöltés sikertelen",
    loadingUsers: "Felhasználók betöltése…",
    noResults: "Nincs találat",
    loadErrorPrefix: "Hiba a betöltéskor:",
    templateDownloadFailed: "Sablon letöltése sikertelen.",
    assignButtonTitle: "Hozzárendelés a kijelölt felhasználóhoz",
    searchLabel: "Keresés a felhasználói táblázatban",
    searchHint: "Szűrés ugyanazokon az adatokon, mint az oszlopok: #, név, Neptun, szak, email",
    colSpec: "MK spec"
  },
  en: {
    title: "Upload progress template",
    searchPlaceholder: "Search name / neptun (uid) / email...",
    downloadTemplate: "Download template",
    downloading: "Downloading…",
    clearSelection: "Clear selection",
    dropHint: "Drop the filled template here (.xlsx / .csv), or click to browse",
    dropSubSelected: "Upload the template for the selected user.",
    dropSubNoSelect: "Select a user from the table first.",
    fileAssignedTo: "File is assigned to user ({id}).",
    fileAssignedOther: "File is currently assigned to {id}.",
    assignToSelected: "Assign to selected user",
    removeFile: "Remove",
    upload: "Upload",
    uploading: "Uploading…",
    cancel: "Cancel",
    chooseUser: "Choose a user!",
    chooseFile: "Choose a file to upload!",
    uploadSuccess: "Upload successful",
    uploadFailed: "Upload failed",
    loadingUsers: "Loading users…",
    noResults: "No results",
    loadErrorPrefix: "Error loading users:",
    templateDownloadFailed: "Template download failed.",
    searchLabel: "Search in user table",
    searchHint: "Filters the same fields as columns: #, name, Neptun, major, email",
    assignButtonTitle: "Assign to selected user",
    colSpec: "MK spec"
  }
};

export const EQUIVALENCES_LABELS = {
  hu: {
    title: "Ekvivalenciák",
    course: "Kurzus",
    equivalentCourse: "Ekvivalens kurzus",
    major: "Szak",
    create: "Létrehoz",
    edit: "Módosít",
    remove: "Töröl",
    loading: "Betöltés...",
    searchPlaceholder: "Keresés kurzus / szak név alapján...",
    refresh: "Frissít",
    selectCoursePlaceholder: "Kurzus - válassz...",
    selectMajorPlaceholder: "Szak - válassz..."
  },
  en: {
    title: "Equivalences",
    course: "Course",
    equivalentCourse: "Equivalent course",
    major: "Major",
    create: "Create",
    edit: "Edit",
    remove: "Delete",
    loading: "Loading...",
    searchPlaceholder: "Search by course / major name...",
    refresh: "Refresh",
    selectCoursePlaceholder: "Course - choose...",
    selectMajorPlaceholder: "Major - choose..."
  }
};

export const ADMIN_LABELS = {
  hu: {
    users: {
      searchPlaceholder: "Keresés név / neptun (uid) / email...",
      edit: "Szerkeszt",
      remove: "Töröl",
      noResults: "Nincs találat",
      loading: "Betöltés..."
    },
    courses: {
      title: "Kurzusok",
      code: "Kód",
      name: "Név",
      credit: "Kredit",
      loading: "Betöltés..."
    },
    courseMajor: {
      title: "Kurzus–Szak kapcsolatok",
      create: "Létrehoz",
      edit: "Módosít",
      remove: "Töröl",
      loading: "Betöltés..."
    },
    equivalences: EQUIVALENCES_LABELS.hu,
    progress: PROGRESS_LABELS.hu
  },
  en: {
    users: {
      searchPlaceholder: "Search name / neptun (uid) / email...",
      edit: "Edit",
      remove: "Delete",
      noResults: "No results",
      loading: "Loading..."
    },
    courses: {
      title: "Courses",
      code: "Code",
      name: "Name",
      credit: "Credit",
      loading: "Loading..."
    },
    courseMajor: {
      title: "Course–Major",
      create: "Create",
      edit: "Edit",
      remove: "Delete",
      loading: "Loading..."
    },
    equivalences: EQUIVALENCES_LABELS.en,
    progress: PROGRESS_LABELS.en
  }
};


export const ADMIN_COMMON = {
  hu: {
    idLabel: "Azonosító",
    courseLabel: "Kurzus",
    majorLabel: "Szak",
    typeLabels: {
      required: "Kötelező",
      elective: "Kötelezően választható",
      optional: "Szabadon választható"
    },
    subgroupLabel: "Alcsoport",
    actions: {
      edit: "Szerkeszt",
      remove: "Töröl",
      create: "Létrehoz",
      cancel: "Mégse"
    }
  },
  en: {
    idLabel: "ID",
    courseLabel: "Course",
    majorLabel: "Major",
    typeLabels: {
      required: "Required",
      elective: "Elective",
      optional: "Optional"
    },
    subgroupLabel: "Subgroup",
    actions: {
      edit: "Edit",
      remove: "Delete",
      create: "Create",
      cancel: "Cancel"
    }
  }
};

export const COURSE_RECOMMENDER_LABELS = {
  hu: {
    title: "Kurzusajánló",
    subtitle: "",
    inputLabel: "Kurzuskódok (opcionális, vesszővel elválasztva)",
    inputPlaceholder: "pl. MBNXK262E, COMP101",
    inputHint: "Ha üresen hagyod, az ajánló automatikusan a teljesített tárgyaid alapján dolgozik.",
    anySemester: "Bármely félév",
    evenSemester: "Páros félév",
    oddSemester: "Páratlan félév",
    submit: "Ajánlások kérése",
    recommending: "Ajánlok...",
    clear: "Törlés",
    loading: "Ajánlások betöltése...",
    recommendedTitle: "Ajánlott kurzusok",
    noRecommendations: "Nem található ajánlás.",
    kód: "Kód",
    név: "Név",
    semester: "Félév",
    credit: "Kredit",
    category: "Kategória",
    score: "Pontszám",
    urgency: "Prioritás",
    similarity: "Hasonlóság",
    why: "Miért ajánlott",
    overdueOnly: "Csak esedékes/elmaradt tárgyak",
    typeFilterLabel: "Tárgytípus:",
    typeAll: "Összes",
    typeRequired: "Csak kötelező",
    typeElective: "Csak kötelezően választható",
    typeOptional: "Csak szabadon választható",
    requiredLabel: "Kötelező",
    electiveLabel: "Kötelezően választható",
    optionalLabel: "Szabadon választható",
    estimatedSemester: "Becsült aktuális féléved",
    overdueBadge: "Esedékes",
    reason: "Ok:",
    requiresLogin: "Jelentkezz be a kurzusajánló használatához!"
  },
  en: {
    title: "Course recommendations",
    subtitle: "",
    inputLabel: "Course codes (optional, comma-separated)",
    inputPlaceholder: "e.g. MBNXK262E, COMP101",
    inputHint: "If left empty, recommendations are generated from your completed courses automatically.",
    anySemester: "Any semester",
    evenSemester: "Even semester",
    oddSemester: "Odd semester",
    submit: "Get recommendations",
    recommending: "Recommending...",
    clear: "Clear",
    loading: "Loading recommendations...",
    recommendedTitle: "Recommended courses",
    noRecommendations: "No recommendations found.",
    kód: "Code",
    név: "Name",
    semester: "Semester",
    credit: "Credit",
    category: "Category",
    score: "Score",
    urgency: "Priority",
    similarity: "Similarity",
    why: "Why recommended",
    overdueOnly: "Only overdue/due subjects",
    typeFilterLabel: "Course type:",
    typeAll: "All",
    typeRequired: "Required only",
    typeElective: "Elective only",
    typeOptional: "Optional only",
    requiredLabel: "Required",
    electiveLabel: "Elective",
    optionalLabel: "Optional",
    estimatedSemester: "Estimated current semester",
    overdueBadge: "Due now",
    reason: "Reason:",
    requiresLogin: "Sign in to use course recommendations!"
  }
};

export const HOME_LABELS = {
  hu: {
    title: "Hallgatói előrehaladás-követő",
    lead:
      "Egyetemi hallgatóknak készült webes alkalmazás a tanulmányi előrehaladás átlátható követésére - a mintatantervhez és a szakodhoz tartozó követelmény-szabályokhoz igazítva.",
    langAria: "Nyelv választása",
    langHu: "Magyar",
    langEn: "English",
    aboutTitle: "Miről szól ez az oldal?",
    aboutText:
      "A rendszer összekapcsolja a kurzusokat, a szakhoz rendelt követelmény-szabályokat és a hallgató által rögzített teljesítéseket. Egy helyen láthatod, miből mennyi van még hátra, és hogyan illeszkednek a tantárgyaid a szabályokhoz. A fejlesztés egy BSc szakdolgozat keretében készült: célja bemutatni, hogyan lehet a Neptunhoz és a tantervi struktúrához kapcsolódó adatokat felhasználni egy követhető, interaktív felületen.",
    userTitle: "Mit tudsz a hallgatói felületről?",
    userItems: [
      "Regisztráció és bejelentkezés, e-mail megerősítés, profil és jelszó kezelése.",
      "Előrehaladás-követés: teljesített és folyamatban lévő kurzusok, kredit- és követelmény-szempontú áttekintés a választott szakhoz.",
      "Szakonkénti chat: üzenetek és reakciók a hallgatótársakkal.",
      "Kurzusajánló: a haladásod és a követelmény-szabályok alapján személyre szabott javaslatok.",
      "A felület magyar és angol nyelven használható; a nyelvet itt felül, illetve a menüben is válthatod.",
    ],
    adminTitle: "Adminisztráció (nem hallgatói szerepkör)",
    adminText:
      "Külön jogosultsággal elérhetők tanterv- és adatkezelő funkciók (például mintatanterv import, PDF-alapú ellenőrzések). Ezek a szakdolgozatban bemutatott háttér-folyamatok részei; a mindennapi hallgatói használat a fenti funkciókra épül.",
    thesisTitle: "A szakdolgozat és a technikai keret",
    thesisText:
      "A munka egy önálló webalkalmazást valósít meg: a böngészőben futó React-alapú felület egy FastAPI háttér-szolgáltatással és relációs adatbázissal kommunikál. A téma a tanulmányi haladás modellezése, megjelenítése és - jogosultságtól függően - tantervi adatok betöltése köré épül.",
  },
  en: {
    title: "Student Progress Tracker",
    lead:
      "A web application for university students who want a clear view of academic progress - aligned with the curriculum structure and major-specific requirement rules.",
    langAria: "Choose language",
    langHu: "Magyar",
    langEn: "English",
    aboutTitle: "What is this site?",
    aboutText:
      "The app connects courses, major requirement rules, and the progress you record. In one place you can see what is still outstanding and how your subjects map onto the rules. It was built as part of a BSc thesis to show how Neptun-related and curriculum data can power an interactive, trackable interface.",
    userTitle: "What can you do as a student?",
    userItems: [
      "Sign up and sign in, verify your email, manage your profile and password.",
      "Track progress: completed and in-progress courses, with a credit- and requirement-oriented overview for your major.",
      "Major-scoped chat: messages and reactions with fellow students.",
      "Course recommendations tailored to your progress and requirement rules.",
      "The UI is available in Hungarian and English; switch language here at the top or from the navigation bar.",
    ],
    adminTitle: "Administration (non-student role)",
    adminText:
      "Separate privileged tools exist for curriculum and data maintenance (e.g. syllabus import, PDF-based checks). They are part of the thesis demo’s back-office workflows; everyday student use is centred on the features above.",
    thesisTitle: "Thesis scope and stack",
    thesisText:
      "The project delivers a standalone web app: a React front end talks to a FastAPI backend and a relational database. The work focuses on modelling and presenting study progress, and - where authorised - loading curricular data.",
  },
};

export const PROFILE_LABELS = {
  hu: {
    loginRequired: "Jelentkezz be a profilod megtekintéséhez!",
    title: "Profil",
    name: "Név:",
    email: "Email:",
    neptun: "Neptun / Azonosító:",
    major: "Szak:",
    created: "Regisztrálva:",
    logout: "Kijelentkezés",
    passwordChange: "Jelszó módosítása",
    oldPassword: "Régi jelszó",
    newPassword: "Új jelszó (min. 8 karakter)",
    newPasswordConfirm: "Új jelszó ismét",
    submit: "Jelszó megváltoztatása",
    clear: "Törlés",
    msgMissing: "Add meg a régi és az új jelszót.",
    msgShort: "Az új jelszónak legalább 8 karakternek kell lennie.",
    msgMismatch: "Az új jelszavak nem egyeznek.",
    msgSuccess: "Jelszó sikeresen megváltoztatva.",
    msgNetwork: "Hálózati hiba",
    deleteProfileTitle: "Profil végleges törlése",
    deleteProfileWarning: "FIGYELEM: ez a művelet véglegesen törli a fiókodat és minden kapcsolódó adatodat.",
    deletePassword: "Jelszó a törléshez",
    deleteConfirmCheck: "Értem, hogy ez végleges törlés.",
    deleteButton: "Profil végleges törlése",
    deleteConfirmDialog: "Biztosan végleg törölni szeretnéd a profilodat?",
    deleteNeedPassword: "Add meg a jelszavad a törléshez.",
    deleteNeedCheck: "Jelöld be, hogy érted a végleges törlést.",
    deleteSuccess: "A profil törölve lett.",
    deleteFailed: "A profil törlése sikertelen."
  },
  en: {
    loginRequired: "Sign in to view your profile!",
    title: "Profile",
    name: "Name:",
    email: "Email:",
    neptun: "Neptun / Identifier:",
    major: "Major:",
    created: "Registered:",
    logout: "Logout",
    passwordChange: "Change password",
    oldPassword: "Old password",
    newPassword: "New password (min. 8 chars)",
    newPasswordConfirm: "Confirm new password",
    submit: "Change password",
    clear: "Clear",
    msgMissing: "Please enter the old and new password.",
    msgShort: "New password must be at least 8 characters.",
    msgMismatch: "New passwords do not match.",
    msgSuccess: "Password changed successfully.",
    msgNetwork: "Network error",
    deleteProfileTitle: "Delete profile permanently",
    deleteProfileWarning: "WARNING: this action permanently deletes your account and all related data.",
    deletePassword: "Password for deletion",
    deleteConfirmCheck: "I understand this is permanent.",
    deleteButton: "Delete profile permanently",
    deleteConfirmDialog: "Are you sure you want to permanently delete your profile?",
    deleteNeedPassword: "Enter your password to delete your profile.",
    deleteNeedCheck: "Please confirm that you understand this is permanent.",
    deleteSuccess: "Profile deleted.",
    deleteFailed: "Failed to delete profile."
  }
};

export const PROGRESS_TRACKER_LABELS = {
  hu: {
    loginRequired: "Jelentkezz be az előrehaladás megtekintéséhez!",
    coursesTitle: "Kurzusok és előrehaladás",
    searchPlaceholder: "Keresés név vagy kód alapján...",
    uploadFailed: "Hiba történt a feltöltés során!",
    uploadSuccess: "Sikeres feltöltés!",
    noSaved: "Nincs elmentett kurzusod.",
    requirementsTitle: "Követelmények állapota",
    prev: "Előző",
    page: "Oldal",
    next: "Következő",
    total: "rekord összesen",
    downloadTemplate: "Szakos sablon letöltése",
    templateDownloadFailed: "Nem sikerült letölteni a sablont!"
  },
  en: {
    loginRequired: "Sign in to view your progress!",
    coursesTitle: "Courses and progress",
    searchPlaceholder: "Search by course name or code...",
    uploadFailed: "Upload failed!",
    uploadSuccess: "Upload successful!",
    noSaved: "No saved courses.",
    requirementsTitle: "Requirements status",
    prev: "Prev",
    page: "Page",
    next: "Next",
    total: "records total",
    downloadTemplate: "Download major template",
    templateDownloadFailed: "Failed to download the template!"
  }
};