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

  // Speech, thought, perception
  λαλ: { strongs: 'G2980', greek: 'λαλέω', transliteration: 'laleo', definition: 'To speak, talk' },
  λεγ: { strongs: 'G3004', greek: 'λέγω', transliteration: 'lego', definition: 'To say, speak' },
  ακου: { strongs: 'G191', greek: 'ἀκούω', transliteration: 'akouo', definition: 'To hear' },
  βλεπ: { strongs: 'G991', greek: 'βλέπω', transliteration: 'blepo', definition: 'To see, look, watch' },
  ειδ: { strongs: 'G1492', greek: 'οἶδα', transliteration: 'oida', definition: 'To know (perfect tense with present force)' },
  γινωσκ: { strongs: 'G1097', greek: 'γινώσκω', transliteration: 'ginosko', definition: 'To know, come to know' },
  γνωσ: { strongs: 'G1108', greek: 'γνῶσις', transliteration: 'gnosis', definition: 'Knowledge' },
  σοφι: { strongs: 'G4678', greek: 'σοφία', transliteration: 'sophia', definition: 'Wisdom' },
  γραφ: { strongs: 'G1124', greek: 'γραφή', transliteration: 'graphe', definition: 'Writing, Scripture (also "to write," same root)' },
  διδασκαλ: { strongs: 'G1320', greek: 'διδάσκαλος', transliteration: 'didaskalos', definition: 'Teacher' },
  διδασκ: { strongs: 'G1321', greek: 'διδάσκω', transliteration: 'didasko', definition: 'To teach' },

  // Movement / action verbs
  ερχ: { strongs: 'G2064', greek: 'ἔρχομαι', transliteration: 'erchomai', definition: 'To come, go' },
  πορευ: { strongs: 'G4198', greek: 'πορεύομαι', transliteration: 'poreuomai', definition: 'To go, journey, proceed' },
  ακολουθ: { strongs: 'G190', greek: 'ἀκολουθέω', transliteration: 'akoloutheo', definition: 'To follow' },
  λαμβαν: { strongs: 'G2983', greek: 'λαμβάνω', transliteration: 'lambano', definition: 'To take, receive' },
  διδ: { strongs: 'G1325', greek: 'δίδωμι', transliteration: 'didomi', definition: 'To give' },
  εχ: { strongs: 'G2192', greek: 'ἔχω', transliteration: 'echo', definition: 'To have, hold' },
  ποιε: { strongs: 'G4160', greek: 'ποιέω', transliteration: 'poieo', definition: 'To do, make' },
  εργ: { strongs: 'G2041', greek: 'ἔργον', transliteration: 'ergon', definition: 'Work, deed (also "to work," same root)' },
  εγειρ: { strongs: 'G1453', greek: 'ἐγείρω', transliteration: 'egeiro', definition: 'To raise, rise' },
  κριν: { strongs: 'G2919', greek: 'κρίνω', transliteration: 'krino', definition: 'To judge' },
  κρισ: { strongs: 'G2920', greek: 'κρίσις', transliteration: 'krisis', definition: 'Judgment' },
  πληρ: { strongs: 'G4137', greek: 'πληρόω', transliteration: 'pleroo', definition: 'To fulfill, fill, complete' },
  πειραζ: { strongs: 'G3985', greek: 'πειράζω', transliteration: 'peirazo', definition: 'To tempt, test, try' },
  πειρασμ: { strongs: 'G3986', greek: 'πειρασμός', transliteration: 'peirasmos', definition: 'Temptation, trial, testing' },
  ευλογ: { strongs: 'G2127', greek: 'εὐλογέω', transliteration: 'eulogeo', definition: 'To bless, speak well of' },
  βαπτ: { strongs: 'G907', greek: 'βαπτίζω', transliteration: 'baptizo', definition: 'To baptize, immerse' },

  // Emotion / character
  φοβ: { strongs: 'G5401', greek: 'φόβος', transliteration: 'phobos', definition: 'Fear, dread (also "to fear," same root)' },
  χαρα: { strongs: 'G5479', greek: 'χαρά', transliteration: 'chara', definition: 'Joy' },
  χαιρ: { strongs: 'G5463', greek: 'χαίρω', transliteration: 'chairo', definition: 'To rejoice, be glad' },
  αγαθ: { strongs: 'G18', greek: 'ἀγαθός', transliteration: 'agathos', definition: 'Good' },
  κακ: { strongs: 'G2556', greek: 'κακός', transliteration: 'kakos', definition: 'Bad, evil' },
  πονηρ: { strongs: 'G4190', greek: 'πονηρός', transliteration: 'poneros', definition: 'Evil, wicked' },
  ψευδ: { strongs: 'G5571', greek: 'ψευδής', transliteration: 'pseudes', definition: 'False, lying' },
  αληθ: { strongs: 'G227', greek: 'ἀληθής', transliteration: 'alethes', definition: 'True' },

  // Law, authority, kingdom
  νομ: { strongs: 'G3551', greek: 'νόμος', transliteration: 'nomos', definition: 'Law' },
  εντολ: { strongs: 'G1785', greek: 'ἐντολή', transliteration: 'entole', definition: 'Commandment' },
  εξουσι: { strongs: 'G1849', greek: 'ἐξουσία', transliteration: 'exousia', definition: 'Authority, power, right' },
  δυναμ: { strongs: 'G1411', greek: 'δύναμις', transliteration: 'dynamis', definition: 'Power, might, miracle' },
  βασιλευ: { strongs: 'G935', greek: 'βασιλεύς', transliteration: 'basileus', definition: 'King' },
  αρχ: { strongs: 'G746', greek: 'ἀρχή', transliteration: 'arche', definition: 'Beginning, ruler, origin' },
  τελ: { strongs: 'G5056', greek: 'τέλος', transliteration: 'telos', definition: 'End, goal, purpose (also "to finish," same root)' },

  // Light, time
  φως: { strongs: 'G5457', greek: 'φῶς', transliteration: 'phos', definition: 'Light' },
  σκοτ: { strongs: 'G4655', greek: 'σκότος', transliteration: 'skotos', definition: 'Darkness' },
  αιωνι: { strongs: 'G166', greek: 'αἰώνιος', transliteration: 'aionios', definition: 'Eternal, everlasting' },
  αιων: { strongs: 'G165', greek: 'αἰών', transliteration: 'aion', definition: 'Age, eternity, world (a period of time)' },
  ημερ: { strongs: 'G2250', greek: 'ἡμέρα', transliteration: 'hemera', definition: 'Day' },
  νυκτ: { strongs: 'G3571', greek: 'νύξ', transliteration: 'nyx', definition: 'Night' },
  ωρ: { strongs: 'G5610', greek: 'ὥρα', transliteration: 'hora', definition: 'Hour, time' },

  // Places, people groups
  πολι: { strongs: 'G4172', greek: 'πόλις', transliteration: 'polis', definition: 'City' },
  εθν: { strongs: 'G1484', greek: 'ἔθνος', transliteration: 'ethnos', definition: 'Nation, gentile, people group' },
  λαο: { strongs: 'G2992', greek: 'λαός', transliteration: 'laos', definition: 'People' },
  φυλ: { strongs: 'G5443', greek: 'φυλή', transliteration: 'phyle', definition: 'Tribe' },
  συναγωγ: { strongs: 'G4864', greek: 'συναγωγή', transliteration: 'synagoge', definition: 'Synagogue, assembly' },
  ναο: { strongs: 'G3485', greek: 'ναός', transliteration: 'naos', definition: 'Temple, sanctuary (the inner shrine)' },
  ιερευ: { strongs: 'G2409', greek: 'ἱερεύς', transliteration: 'hiereus', definition: 'Priest' },
  ιερ: { strongs: 'G2411', greek: 'ἱερόν', transliteration: 'hieron', definition: 'Temple, sanctuary (the wider temple complex)' },
  αρχιερ: { strongs: 'G749', greek: 'ἀρχιερεύς', transliteration: 'archiereus', definition: 'High priest, chief priest' },

  // Death, resurrection, cross
  σταυρ: { strongs: 'G4716', greek: 'σταυρός', transliteration: 'stauros', definition: 'Cross (also "to crucify," same root)' },
  αναστασ: { strongs: 'G386', greek: 'ἀνάστασις', transliteration: 'anastasis', definition: 'Resurrection' },
  νεκρ: { strongs: 'G3498', greek: 'νεκρός', transliteration: 'nekros', definition: 'Dead' },

  // Worship, spiritual life
  μαρτυρ: { strongs: 'G3144', greek: 'μάρτυς', transliteration: 'martys', definition: 'Witness (also "to testify," same root — origin of "martyr")' },
  προσευχ: { strongs: 'G4335', greek: 'προσευχή', transliteration: 'proseuche', definition: 'Prayer' },
  δεησ: { strongs: 'G1162', greek: 'δέησις', transliteration: 'deesis', definition: 'Petition, supplication' },
  ευχαριστ: { strongs: 'G2168', greek: 'εὐχαριστέω', transliteration: 'eucharisteo', definition: 'To give thanks (root of "Eucharist")' },
  τιμ: { strongs: 'G5092', greek: 'τιμή', transliteration: 'time', definition: 'Honor, value, price' },
  καταρ: { strongs: 'G2671', greek: 'κατάρα', transliteration: 'katara', definition: 'Curse' },
  διαβολ: { strongs: 'G1228', greek: 'διάβολος', transliteration: 'diabolos', definition: 'Devil, slanderer' },
  σαταν: { strongs: 'G4567', greek: 'Σατανᾶς', transliteration: 'satanas', definition: 'Satan, adversary' },
  δαιμον: { strongs: 'G1140', greek: 'δαιμόνιον', transliteration: 'daimonion', definition: 'Demon' },
  αγγελ: { strongs: 'G32', greek: 'ἄγγελος', transliteration: 'angelos', definition: 'Angel, messenger' },

  // Body, nature, everyday things
  υδατ: { strongs: 'G5204', greek: 'ὕδωρ', transliteration: 'hydor', definition: 'Water' },
  πυρ: { strongs: 'G4442', greek: 'πῦρ', transliteration: 'pyr', definition: 'Fire' },
  ανεμ: { strongs: 'G417', greek: 'ἄνεμος', transliteration: 'anemos', definition: 'Wind' },
  γλωσσ: { strongs: 'G1100', greek: 'γλῶσσα', transliteration: 'glossa', definition: 'Tongue, language' },
  στομ: { strongs: 'G4750', greek: 'στόμα', transliteration: 'stoma', definition: 'Mouth' },
  οφθαλμ: { strongs: 'G3788', greek: 'ὀφθαλμός', transliteration: 'ophthalmos', definition: 'Eye' },
  χειρ: { strongs: 'G5495', greek: 'χείρ', transliteration: 'cheir', definition: 'Hand' },
  ποδ: { strongs: 'G4228', greek: 'πούς', transliteration: 'pous', definition: 'Foot' },
  σαρκ: { strongs: 'G4561', greek: 'σάρξ', transliteration: 'sarx', definition: 'Flesh' },
  αιματ: { strongs: 'G129', greek: 'αἷμα', transliteration: 'haima', definition: 'Blood' },
  καρπ: { strongs: 'G2590', greek: 'καρπός', transliteration: 'karpos', definition: 'Fruit' },
  σπερμ: { strongs: 'G4690', greek: 'σπέρμα', transliteration: 'sperma', definition: 'Seed, offspring' },
  οινο: { strongs: 'G3631', greek: 'οἶνος', transliteration: 'oinos', definition: 'Wine' },
  αρτ: { strongs: 'G740', greek: 'ἄρτος', transliteration: 'artos', definition: 'Bread' },
  ελαι: { strongs: 'G1637', greek: 'ἔλαιον', transliteration: 'elaion', definition: 'Olive oil (also "olive tree," same root)' },
  αμπελ: { strongs: 'G288', greek: 'ἄμπελος', transliteration: 'ampelos', definition: 'Vine, grapevine' },
  ξυλ: { strongs: 'G3586', greek: 'ξύλον', transliteration: 'xylon', definition: 'Wood, tree, cross ("the tree")' },
  λιθ: { strongs: 'G3037', greek: 'λίθος', transliteration: 'lithos', definition: 'Stone' },
  χρυσ: { strongs: 'G5557', greek: 'χρυσός', transliteration: 'chrysos', definition: 'Gold' },
  αργυρ: { strongs: 'G696', greek: 'ἄργυρος', transliteration: 'argyros', definition: 'Silver' },
  σιδηρ: { strongs: 'G4604', greek: 'σίδηρος', transliteration: 'sideros', definition: 'Iron' },

  // Animals
  προβατ: { strongs: 'G4263', greek: 'πρόβατον', transliteration: 'probaton', definition: 'Sheep' },
  αμν: { strongs: 'G286', greek: 'ἀμνός', transliteration: 'amnos', definition: 'Lamb' },
  λυκ: { strongs: 'G3074', greek: 'λύκος', transliteration: 'lykos', definition: 'Wolf' },
  οφι: { strongs: 'G3789', greek: 'ὄφις', transliteration: 'ophis', definition: 'Serpent, snake' },
  ιχθ: { strongs: 'G2486', greek: 'ἰχθύς', transliteration: 'ichthys', definition: 'Fish' },

  // War
  πολεμ: { strongs: 'G4171', greek: 'πόλεμος', transliteration: 'polemos', definition: 'War, battle' },
  μαχαιρ: { strongs: 'G3162', greek: 'μάχαιρα', transliteration: 'machaira', definition: 'Sword' },
  στρατιωτ: { strongs: 'G4757', greek: 'στρατιώτης', transliteration: 'stratiotes', definition: 'Soldier' },

  // Proper names
  ιησ: { strongs: 'G2424', greek: 'Ἰησοῦς', transliteration: 'Iesous', definition: 'Jesus (Greek form of the Hebrew name Yeshua/Joshua, "YHWH saves")' },
  πετρ: { strongs: 'G4074', greek: 'Πέτρος', transliteration: 'Petros', definition: 'Peter ("rock")' },
  παυλ: { strongs: 'G3972', greek: 'Παῦλος', transliteration: 'Paulos', definition: 'Paul' },
  ιωανν: { strongs: 'G2491', greek: 'Ἰωάννης', transliteration: 'Ioannes', definition: 'John' },
  μωσ: { strongs: 'G3475', greek: 'Μωσῆς', transliteration: 'Moses', definition: 'Moses (Greek form of the Hebrew name)' },
  δαβιδ: { strongs: 'G1138', greek: 'Δαβίδ', transliteration: 'David', definition: 'David' },
}
