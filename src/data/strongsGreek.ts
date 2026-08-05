export interface GreekStrongsEntry {
  strongs: string
  greek: string
  transliteration: string
  definition: string
}

/**
 * A curated set of key New Testament Greek words for word study, keyed by
 * a normalized (diacritic-stripped, lowercased) stem. Not exhaustive — a
 * hand-picked list of theologically significant words, not a full
 * interlinear tagging of every word in the text.
 */
export const STRONGS_GREEK: Record<string, GreekStrongsEntry> = {
  αγαπη: { strongs: 'G26', greek: 'ἀγάπη', transliteration: 'agape', definition: 'Love — selfless, sacrificial love' },
  αγαπ: { strongs: 'G25', greek: 'ἀγαπάω', transliteration: 'agapao', definition: 'To love' },
  λογ: { strongs: 'G3056', greek: 'λόγος', transliteration: 'logos', definition: 'Word, message, reason' },
  πιστις: { strongs: 'G4102', greek: 'πίστις', transliteration: 'pistis', definition: 'Faith, belief, trust' },
  πιστευ: { strongs: 'G4100', greek: 'πιστεύω', transliteration: 'pisteuo', definition: 'To believe, trust' },
  χαρις: { strongs: 'G5485', greek: 'χάρις', transliteration: 'charis', definition: 'Grace, favor, kindness' },
  εκκλησι: { strongs: 'G1577', greek: 'ἐκκλησία', transliteration: 'ekklesia', definition: 'Assembly, congregation, church' },
  ευαγγελ: { strongs: 'G2098', greek: 'εὐαγγέλιον', transliteration: 'euangelion', definition: 'Good news, gospel' },
  σωτηρι: { strongs: 'G4991', greek: 'σωτηρία', transliteration: 'soteria', definition: 'Salvation, deliverance' },
  πνευμ: { strongs: 'G4151', greek: 'πνεῦμα', transliteration: 'pneuma', definition: 'Spirit, wind, breath' },
  χριστ: { strongs: 'G5547', greek: 'Χριστός', transliteration: 'Christos', definition: 'Christ, Anointed One (the Greek equivalent of Messiah)' },
  κυρι: { strongs: 'G2962', greek: 'κύριος', transliteration: 'kyrios', definition: 'Lord, master' },
  θε: { strongs: 'G2316', greek: 'θεός', transliteration: 'theos', definition: 'God, god' },
  πατ: { strongs: 'G3962', greek: 'πατήρ', transliteration: 'pater', definition: 'Father' },
  υι: { strongs: 'G5207', greek: 'υἱός', transliteration: 'huios', definition: 'Son' },
  ανθρωπ: { strongs: 'G444', greek: 'ἄνθρωπος', transliteration: 'anthropos', definition: 'Man, human being, mankind' },
  ζω: { strongs: 'G2222', greek: 'ζωή', transliteration: 'zoe', definition: 'Life' },
  θανατ: { strongs: 'G2288', greek: 'θάνατος', transliteration: 'thanatos', definition: 'Death' },
  αμαρτι: { strongs: 'G266', greek: 'ἁμαρτία', transliteration: 'hamartia', definition: 'Sin (literally "missing the mark")' },
  μετανοι: { strongs: 'G3340', greek: 'μετάνοια', transliteration: 'metanoia', definition: 'Repentance, a change of mind' },
  αφεσ: { strongs: 'G859', greek: 'ἄφεσις', transliteration: 'aphesis', definition: 'Forgiveness, release, pardon' },
  δοξ: { strongs: 'G1391', greek: 'δόξα', transliteration: 'doxa', definition: 'Glory, honor, splendor' },
  ειρην: { strongs: 'G1515', greek: 'εἰρήνη', transliteration: 'eirene', definition: 'Peace' },
  αληθει: { strongs: 'G225', greek: 'ἀλήθεια', transliteration: 'aletheia', definition: 'Truth' },
  βασιλει: { strongs: 'G932', greek: 'βασιλεία', transliteration: 'basileia', definition: 'Kingdom, reign, rule' },
  ουραν: { strongs: 'G3772', greek: 'οὐρανός', transliteration: 'ouranos', definition: 'Heaven, sky' },
  γ: { strongs: 'G1093', greek: 'γῆ', transliteration: 'ge', definition: 'Earth, land, ground' },
  κοσμ: { strongs: 'G2889', greek: 'κόσμος', transliteration: 'kosmos', definition: 'World, universe, order' },
  οικ: { strongs: 'G3624', greek: 'οἶκος', transliteration: 'oikos', definition: 'House, household' },
  αδελφ: { strongs: 'G80', greek: 'ἀδελφός', transliteration: 'adelphos', definition: 'Brother' },
  διακον: { strongs: 'G1247', greek: 'διακονέω', transliteration: 'diakoneo', definition: 'To serve, minister (root of "deacon")' },
  δουλ: { strongs: 'G1401', greek: 'δοῦλος', transliteration: 'doulos', definition: 'Servant, slave, bondservant' },
  αποστολ: { strongs: 'G652', greek: 'ἀπόστολος', transliteration: 'apostolos', definition: 'Apostle, one sent forth, messenger' },
  προφητ: { strongs: 'G4396', greek: 'προφήτης', transliteration: 'prophetes', definition: 'Prophet' },
  μαθητ: { strongs: 'G3101', greek: 'μαθητής', transliteration: 'mathetes', definition: 'Disciple, student, learner' },
  διαθηκ: { strongs: 'G1242', greek: 'διαθήκη', transliteration: 'diatheke', definition: 'Covenant, testament' },
  αγι: { strongs: 'G40', greek: 'ἅγιος', transliteration: 'hagios', definition: 'Holy, saint, set apart' },
  ψυχ: { strongs: 'G5590', greek: 'ψυχή', transliteration: 'psyche', definition: 'Soul, life, self' },
  σωμ: { strongs: 'G4983', greek: 'σῶμα', transliteration: 'soma', definition: 'Body' },
  καρδι: { strongs: 'G2588', greek: 'καρδία', transliteration: 'kardia', definition: 'Heart' },
  δικαι: { strongs: 'G1342', greek: 'δίκαιος', transliteration: 'dikaios', definition: 'Righteous, just' },
  δικαιοσυν: { strongs: 'G1343', greek: 'δικαιοσύνη', transliteration: 'dikaiosyne', definition: 'Righteousness, justice' },
  ελπ: { strongs: 'G1680', greek: 'ἐλπίς', transliteration: 'elpis', definition: 'Hope' },
}
