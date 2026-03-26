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
    searchHint: "Szűrés ugyanazokon az adatokon, mint az oszlopok: #, név, Neptun, szak, email"
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
    assignButtonTitle: "Assign to selected user"
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
    selectCoursePlaceholder: "Kurzus — válassz...",
    selectMajorPlaceholder: "Szak — válassz..."
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
    selectCoursePlaceholder: "Course — choose...",
    selectMajorPlaceholder: "Major — choose..."
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
    inputLabel: "Kurzuskódok (vesszővel elválasztva)",
    inputPlaceholder: "pl. MBNXK262E, COMP101",
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
    estimatedSemester: "Becsült aktuális féléved",
    overdueBadge: "Esedékes",
    reason: "Ok:",
    requiresLogin: "Jelentkezz be a kurzusajánló használatához!"
  },
  en: {
    title: "Course recommendations",
    subtitle: "",
    inputLabel: "Course codes (comma-separated)",
    inputPlaceholder: "e.g. MBNXK262E, COMP101",
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
    estimatedSemester: "Estimated current semester",
    overdueBadge: "Due now",
    reason: "Reason:",
    requiresLogin: "Sign in to use course recommendations!"
  }
};

export const HOME_LABELS = {
  hu: {
    title: "Hallgatói előrehaladás-követő",
    subtitle: "Üdvözlünk a szakdolgozati projekt főoldalán!"
  },
  en: {
    title: "Student Progress Tracker",
    subtitle: "Welcome to the thesis project's home page!"
  }
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
    total: "rekord összesen"
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
    total: "records total"
  }
};