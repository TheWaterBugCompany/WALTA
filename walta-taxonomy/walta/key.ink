/* Start at the key identification */
-> root 

/* Question Nodes */

=== root ===
* Animal with a shell -> k_mollusca # mediaUrls: ["/taxonomy/walta/media/withshell.gif"]
* Animal without a shell -> node_1 # mediaUrls: ["/taxonomy/walta/media/withoutshell.gif"]

=== k_mollusca ===
* Animals look like snails or limpets. -> node_2 # mediaUrls: []
* Animals look like mussels. -> k_bivalvia # mediaUrls: []

=== node_2 ===
* Animals look like snails. -> k_gastropoda # mediaUrls: []
* Animals look like limpets. -> ancylidae # mediaUrls: []

=== k_gastropoda ===
* Snails with flat shells. -> flat_snails # mediaUrls: []
* Shells are not flat, have normal spire. -> node_3 # mediaUrls: []

=== node_3 ===
* Snails are coiled, small (less than 10mm), often black or dark brown and can occur in large numbers. -> potamopyrgus_antipodarum # mediaUrls: ["/taxonomy/walta/media/potamopyrgus_02.gif"]
* Snails not as above. -> node_4 # mediaUrls: []

=== node_4 ===
* Shell sinistral (left handed - or footed) -> node_5 # mediaUrls: ["/taxonomy/walta/media/shell_sinistral.gif"]
* Shell dextral (right handed) -> lymnaeidae # mediaUrls: ["/taxonomy/walta/media/shell_dextral.gif"]

=== node_5 ===
* Mottled pattern visible through the shell. You might need good light to see this -> physa_acuta # mediaUrls: ["/taxonomy/walta/media/Physa_acuta_closeup.jpg"]
* Snail without obvious mottling. -> planorbids # mediaUrls: []

=== k_bivalvia ===
* Shell halves are large (longer than 25 mm), dark, thick and usually not symmetrical. -> hyriidae # mediaUrls: []
* Shell halves are small (less than 25 mm); light coloured, relatively thin and symmetrical. -> sphaeriidae_and_corbiculidae # mediaUrls: []

=== node_1 ===
* Animal with legs -> k_arthropoda # mediaUrls: ["/taxonomy/walta/media/withlegs.gif"]
* Animal without legs -> k_worm_like # mediaUrls: ["/taxonomy/walta/media/withoutlegs.gif"]

=== k_arthropoda ===
* With more than eight legs -> k_crustacea # mediaUrls: ["/taxonomy/walta/media/morethaneightlegs.gif"]
* With eight legs or less -> node_6 # mediaUrls: []

=== k_crustacea ===
* Robust animals, freshwater crayfish or yabbies with obvious front pincers, movement walking or sometimes 'flips' of the tail that propel the animal backwards. -> parastacidae # mediaUrls: []
* Not as above. -> node_7 # mediaUrls: []

=== node_7 ===
* Shrimp or prawn-like animals. -> k_shrimpandprawns # mediaUrls: ["/taxonomy/walta/media/shrimplike.gif"]
* Not as above. -> node_8 # mediaUrls: []

=== k_shrimpandprawns ===
* Second leg with pincers and noticeably longer than others. Body translucent/opaque. -> macrobrachium # mediaUrls: []
* Transparent (or at least translucent) front pairs of legs similar sized. -> atyidae # mediaUrls: []

=== node_8 ===
* Round body, slow-moving, obviously crab-like (see image). -> hymenosomatidae # mediaUrls: ["/taxonomy/walta/media/crablike.gif"]
* Not as above. -> node_9 # mediaUrls: []

=== node_9 ===
* Animals strongly flattened from the sides (like dogs and cats); often lying on their side or moving with their side flat against the substrate. -> node_10 # mediaUrls: ["/taxonomy/walta/media/sidesquashed.gif"]
* Animals not flattened or flattened 'front to back' (like humans or cockroaches). -> node_11 # mediaUrls: ["/taxonomy/walta/media/frontbacksquashed.gif"]

=== node_10 ===
* Animal rests on its side, swims in swift bursts. -> amphipoda # mediaUrls: ["/taxonomy/walta/media/amphipoda_02.jpg"]
* Animal slow moving, walks, relatively robust looking animal, bovine. -> phreatoicidae # mediaUrls: ["/taxonomy/walta/media/phreatoicidae_02.jpg"]

=== node_11 ===
* Small, pale (white to light brown or grey) crustacean, final segments as broad or broader than head, slow moving and slater-like. -> janiridae # mediaUrls: []
* Not as above. -> node_12 # mediaUrls: []

=== node_12 ===
* Animal looks like this. -> anostraca # mediaUrls: ["/taxonomy/walta/media/anostraca_01.jpg"]
* Not as above -> node_13 # mediaUrls: []

=== node_13 ===
* Animal looks like this. -> notostraca # mediaUrls: ["/taxonomy/walta/media/notostraca_01.jpg"]
* Not as above. -> conchostraca # mediaUrls: []

=== node_6 ===
* with eight legs -> k_chelicerata # mediaUrls: ["/taxonomy/walta/media/eightlegs.gif"]
* with six legs -> k_hexapoda # mediaUrls: ["/taxonomy/walta/media/sixlegs.gif"]

=== k_chelicerata ===
* found under water -> acarina # mediaUrls: []
* found on the surface of the water, or if underneath, it is covered in a silvery bubble of air. -> pisauridae_and_lycosidae # mediaUrls: []

=== k_hexapoda ===
* with wing covers -> node_14 # mediaUrls: ["/taxonomy/walta/media/wingcovers.gif"]
* with no wing covers, possibly with wing buds -> node_15 # mediaUrls: ["/taxonomy/walta/media/nowingcovers.gif"]

=== node_14 ===
* hard wingcovers, symmetrical -> k_coleoptera # mediaUrls: ["/taxonomy/walta/media/hardwingcovers.gif"]
* leathery wingcovers, asymmetrical -> k_hemiptera # mediaUrls: ["/taxonomy/walta/media/leatherywingcovers.gif"]

=== k_coleoptera ===
* Beetles active swimmers -> node_16 # mediaUrls: []
* Beetles crawl (or don't move much). -> node_17 # mediaUrls: []

=== node_16 ===
* Beetles swim rapidly in circular patterns on the water surface as well as below, shiny beetles with legs tucked neatly under body, often found in groups. -> gyrinidae_adult # mediaUrls: []
* Beetles swim submerged, with obvious legs. -> node_18 # mediaUrls: []

=== node_18 ===
* Beetles move with all 3 or at least 2 pairs of legs. Legs move alternately.  -> node_19 # mediaUrls: ["/taxonomy/walta/media/elmidae_m1.mp4"]
* Beetles appear to swim smoothly with only the rear pair of legs, legs move in unison; motion is like breast stroke. Rear swimming legs held upwards when beetle rests. -> k_dytiscidae # mediaUrls: ["/taxonomy/walta/media/lancetes_m1.mp4"]

=== node_19 ===
* Always with a black head and a brown body; may screech when in net or tray. Distinctively 'lumpy' appearance; Rare. -> hygrobia_adult # mediaUrls: []
* Often black but may be green or brown. Flat on the underside, sometimes with a bubble vest; head bent downwards; Common. -> hydrophilidae_adult # mediaUrls: []

=== k_dytiscidae ===
* less than 10mm  -> node_20 # mediaUrls: []
* larger than 10mm -> node_21 # mediaUrls: []

=== node_20 ===
* less than 4mm -> node_22 # mediaUrls: []
* greater than 4mm -> node_23 # mediaUrls: []

=== node_22 ===
* Body segment associated with first pair of legs constricted to give the beetle a distinctly waisted look. -> carabhydrus # mediaUrls: []
* Not as above. -> node_24 # mediaUrls: []

=== node_24 ===
* Conspicuous lateral stripes, water-drop shaped beetles. -> australphilus # mediaUrls: []
* Not as above. -> little_diving_beetles # mediaUrls: []

=== node_23 ===
* Beetles with some form of colour pattern (variable patterns: mottled, brindled, stripes or patches.) -> mixed_diving_beetles # mediaUrls: []
* Beetles totally lack colour. Black. -> stealth_diving_beetles # mediaUrls: []

=== node_21 ===
* less than 15mm -> node_25 # mediaUrls: []
* larger than 15mm -> node_26 # mediaUrls: []

=== node_25 ===
* Beetle with distinctive longitudinal stripes (like a pin-stripe). -> lancetes # mediaUrls: []
* Beetle without longitudinal stripes -> node_27 # mediaUrls: []

=== node_27 ===
* Beetle with dark patch in middle of head, body pale underneath.  -> eretes # mediaUrls: []
* Beetle with light patch in middle of head, body dark underneath. -> rhantus # mediaUrls: []

=== node_26 ===
* Beetle black / dark. -> hyderodes # mediaUrls: []
* Beetle green. -> node_28 # mediaUrls: []

=== node_28 ===
* Beetle with dark undersides. Never larger than 20mm. -> spencerhydrus # mediaUrls: []
* Beetle with orange undersides. Often larger than 20mm. -> onychohydrus # mediaUrls: []

=== node_17 ===
* Beetle has a distinct 'nose' or snout. -> curculionidae # mediaUrls: []
* Beetle has no 'nose'. (How does it smell?) -> node_29 # mediaUrls: []

=== node_29 ===
* Small to tiny beetles with well-developed claws, usually black, sometimes dark brown or red, with a shiny plastron or bubble vest; slow moving, sometimes hang motionless mid-water. -> elmidae_adult # mediaUrls: []
* Not as above, may crawl on the underside of the water surface. -> node_30 # mediaUrls: []

=== node_30 ===
* Small to tiny, elongate, often metallic beetles. Rare -> hydraenidae_and_hydrochidae # mediaUrls: []
* Larger dull coloured beetles sometimes with prominent yellow egg sac. -> helochares # mediaUrls: []

=== k_hemiptera ===
* Bugs walking/running on the water surface. -> node_31 # mediaUrls: []
* Bugs swimming below the surface. -> node_32 # mediaUrls: []

=== node_31 ===
* Short bodied bugs that move quickly on the water surface.   -> node_33 # mediaUrls: []
* Elongate bugs with antennae at the very tip of the head. Walk slowly on water surface.  -> hydrometridae # mediaUrls: []

=== node_33 ===
* Bugs with very long hind and middle legs. Move with a skating/sculling motion. -> gerridae # mediaUrls: []
* Small to tiny bugs with shorter legs, running on the water surface. -> veliidae_mesoveliidae_and_hebridae # mediaUrls: []

=== node_32 ===
* Bugs walk or swim awkwardly.  -> node_34 # mediaUrls: []
* Bugs swim well. -> node_35 # mediaUrls: []

=== node_34 ===
* Ugly dark brown bugs with wide heads and a warty appearance. Pointed, grasping front legs. Semi-aquatic.  -> gelastocoridae # mediaUrls: []
* Large (>20mm), elongate bugs with front legs for grabbing prey. Body stick or leaf like. Long legs. Long breathing tube at hind end. -> k_nepidae # mediaUrls: []

=== k_nepidae ===
* Long, thin, skinny bug, pale coloured. Looks like a stick or a piece of sedge. -> ranatra # mediaUrls: []
* Long flattened bug, dark or black. Looks like a leaf. -> laccotrephes # mediaUrls: []

=== node_35 ===
* Bugs swim upside down, with legs uppermost, dark on upper surface, lighter coloured underneath. -> node_36 # mediaUrls: []
* Bugs swim the right way up, with legs beneath them, wings on the upper surface if present. -> k_bugs # mediaUrls: []

=== node_36 ===
* Tiny orange bugs with a highly convex humped back. No prominent swimming legs. Look a bit like a tiny, mobile jelly bean. -> pleidae # mediaUrls: []
* Elongate bugs with two prominent, narrow swimming legs. Swim with a jerky motion. Very active. Obviously dark on one side (top) and light on the other (underneath). -> k_notonectidae # mediaUrls: []

=== k_notonectidae ===
* Robust, chunky, fast moving. Either at water surface or holding onto something. Triangular when viewed from above (animal on left of image). -> enithares # mediaUrls: ["/taxonomy/walta/media/enithares_anisops.jpg"]
* Slender, relaxed, unhurried movement. Able to stay still mid-water (thanks to buoyancy regulation). Thinner and parallel sided when viewed from above (animal on right of image). -> anisops # mediaUrls: []

=== k_bugs ===
* Larger 10-30mm bugs. Front legs pointed for piercing prey. Do not flick swimming legs when at rest. -> node_37 # mediaUrls: []
* Small (<10mm) active bugs with two broad paddle like swimming legs which they flick back and forth when at rest. Streamlined body, blunt head. An air bubble may be visible under the body. May make buzzing or squeaking sounds in the tray. -> k_corixidae # mediaUrls: ["/taxonomy/walta/media/corixidae_m2.mp4"]

=== node_37 ===
* Medium sized bugs (10-15mm) with broad heads and light/dark checks (taxi stripes) along their sides. -> naucoris # mediaUrls: []
* Larger bugs (up to 30mm) without checks. Flattened body, narrower heads.  -> diplonychus # mediaUrls: []

=== k_corixidae ===
* Head with 'nostrils' (Ocelli, they are more like eyes - see photo). Usually distinctly orange or yellow coloured head and underneath. -> diaprepocoris_barycephala # mediaUrls: ["/taxonomy/walta/media/diaprepocoris_01.jpg"]
* Not as above. -> node_38 # mediaUrls: []

=== node_38 ===
* Segment after the head (pronotum) with distinctive stripes or bands (see photo) you need a hand lens to see this. -> sigara # mediaUrls: ["/taxonomy/walta/media/sigara_01.jpg"]
* Not as above. -> node_39 # mediaUrls: []

=== node_39 ===
* Small boatmen (<4mm), mottled or brindle wing covers (see photo). By far the commonest corixid. -> micronecta # mediaUrls: ["/taxonomy/walta/media/micronecta_01.jpg"]
* Large boatmen (>4mm) brown /yellow /grey, markings are not distinctive, looks a lot like television static (pre-digital telly). Unlike all of the above. Rare. -> agraptocorixa # mediaUrls: []

=== node_15 ===
* no obvious tails -> node_40 # mediaUrls: ["/taxonomy/walta/media/notails.gif"]
* with obvious tails -> node_41 # mediaUrls: ["/taxonomy/walta/media/withtails.gif"]

=== node_40 ===
* with a case. Sometimes the case may be lost. Look for small, terminal, lateral hooks on the abdomen or ventral pro-legs on the abdomen. -> node_42 # mediaUrls: ["/taxonomy/walta/media/withcase.gif"]
* without a case -> node_43 # mediaUrls: ["/taxonomy/walta/media/nocase.gif"]

=== node_42 ===
* longlegs,case never with coarse vegetation attached lengthways -> k_trichoptera # mediaUrls: ["/taxonomy/walta/media/casedcaddisflies.gif"]
* short, stumpy legs, case with coarse vegetation attached lengthways -> lepidoptera # mediaUrls: ["/taxonomy/walta/media/aquatic_caterpillers_01.gif"]

=== k_trichoptera ===
* Caddis living in a portable case. Most crawl slowly, some swim by head-thrashing or arm-waving; if out of case, body blunt ending with tiny prolegs and hooks. -> k_cased # mediaUrls: []
* Free-living caddis, body, long abdominal pro-legs with prominent claws. -> node_44 # mediaUrls: []

=== k_cased ===
* Tiny larvae <5mm long. Abdomen yellow, swollen, thicker than thorax. Purse shaped case of translucent silk, sometimes with sand or algae. Slow moving, hard to see. -> hydroptilidae # mediaUrls: []
* Not as above. -> node_45 # mediaUrls: []

=== node_45 ===
* Fang-shaped case made from fine particles, sometimes with a groove. Hind legs curved like talons, head pointy, all body segments covered in hairs. -> atriplectides # mediaUrls: []
* Not as above. -> node_46 # mediaUrls: []

=== node_46 ===
* Case made mainly from coarse sand. -> node_47 # mediaUrls: []
* Case made from plant material or silk secretion but may incorporate some mineral particles. -> node_48 # mediaUrls: []

=== node_47 ===
* Case like a messy ‘sand igloo’. Larvae fall out easily. Slow moving.  -> agapetus # mediaUrls: []
* Case not like a messy sand igloo. -> node_49 # mediaUrls: []

=== node_49 ===
* Case appears round but is actually coiled like a snail shell. Active but slow moving. -> helicopsyche # mediaUrls: []
* Case not like a snail shell. -> node_50 # mediaUrls: []

=== node_50 ===
* Case triangular, often with larger particles down each side. Eyes of larvae protrude when viewed from above. -> tasimiidae # mediaUrls: []
* Case tubular, legs sharp, for grabbing prey. Fast deliberate movement. -> node_51 # mediaUrls: []

=== node_51 ===
* Animal found in highland site -> philorheithridae # mediaUrls: []
* Animal found in a lowland site -> attack_caddis_lowlander # mediaUrls: []

=== node_48 ===
* Case made from flat pieces of leaf, giving it a flat appearance overall. -> node_52 # mediaUrls: []
* Case made from all sorts, including: silk secretion, sticks, or other plant material and sometimes sand (never leaf plates by themselves). Case not flat. -> node_53 # mediaUrls: []

=== node_52 ===
* Case built from 2 flat pieces of leaf, the dorsal piece is slightly larger forming a 'veranda'. -> anisocentropus # mediaUrls: []
* Not as above -> node_54 # mediaUrls: []

=== node_54 ===
* Case built from many round, shingle-like bits of leaf, in two distinct rows.  -> caenota_plicata # mediaUrls: []
* Case built from a messy assortment of leaf plates, but still flat. Sometimes tapered quite severely. -> lectrides_varians # mediaUrls: []

=== node_53 ===
* Larvae with short legs, head compact, bullet like. Case often made with rings of different colours, sometimes with sand or may look like orange plastic. Slow moving, never swimming. -> conoesucidae_calocidae_and_helicophidae # mediaUrls: []
* Larvae with long legs; may swim by thrashing their head about. Case variable.  -> k_leptoceridae # mediaUrls: []

=== k_leptoceridae ===
* Case constructed from a single stick or piece of aquatic plant. -> triplectides # mediaUrls: []
* Not as above. -> node_55 # mediaUrls: []

=== node_55 ===
* Case constructed like a log cabin, square in cross section (see photo). -> log_cabin_caddis # mediaUrls: ["/taxonomy/walta/media/log_cabin_caddis_01.jpg"]
* Not as above. -> node_56 # mediaUrls: []

=== node_56 ===
* Case with sand or fine gravel at the opening (front) and the rest of the case made from pieces of vegetation. -> symphitoneuria # mediaUrls: []
* Not as above. -> node_57 # mediaUrls: []

=== node_57 ===
* Case made from a variety of materials, may be arranged spirally (but not always). When disturbed animal flails its body in a head-banging motion. -> notalina # mediaUrls: []
* Not as above. Generally a mix of caddis with long hind legs and mixed messy cases -> leptocerids # mediaUrls: []

=== node_44 ===
* All three thoracic segments hard or sclerotised, they appear darker or different in colour to the soft abdomen. -> node_58 # mediaUrls: []
* Only the first thoracic segment sclerotised. -> node_59 # mediaUrls: []

=== node_58 ===
* Abdominal gills present (hairy chest), slow moving. May undulate abdomen to ventilate gills. To 15mm. -> hydropsychidae # mediaUrls: []
* Abdominal gills absent, often with a pattern on the head like a bandits mask. -> ecnomus # mediaUrls: []

=== node_59 ===
* Larvae often green when alive. Forelegs modified into a pincer, or broad with a large spine. Larvae hunt from side to side with the forelegs. -> hydrobiosidae # mediaUrls: []
* Larvae without pincers, body not green. Often pale, head brown or yellow. Don't tend to hunt actively. -> philopotamidae_polycentropodidae_and_ecnomidae # mediaUrls: []

=== node_43 ===
* with wingbuds and well developed compound eyes -> k_odonata # mediaUrls: ["/taxonomy/walta/media/compoundeyes.gif"]
* without wing buds, eyes simple dots  -> k_larval # mediaUrls: ["/taxonomy/walta/media/doteyes.gif"]

=== k_odonata ===
* Slender larvae, with 3 terminal gills. Swim by undulating (snake-like). -> k_zygoptera # mediaUrls: []
* Robust larvae, without terminal gills. Swim by jetting water out of their bums. -> k_epiproctophora # mediaUrls: []

=== k_zygoptera ===
* Leaf-like terminal gills held flat and fanned out horizontally. -> megapodagrionidae # mediaUrls: []
* Gills different in shape or orientation. -> node_60 # mediaUrls: []

=== node_60 ===
* Gills shorter than last 3 abdominal segments -> synlestidae # mediaUrls: []
* Gills equal in length or longer than last 3 abdominal segments. -> node_61 # mediaUrls: []

=== node_61 ===
* Gills divided into two parts by constriction. -> isostictidae # mediaUrls: []
* Gills complete, without constriction. -> node_62 # mediaUrls: []

=== node_62 ===
* Gills sack-like, with hairy ends. -> diphlebiidae # mediaUrls: []
* Gills leaf like. -> lestidae_and_coenagrionidae # mediaUrls: []

=== k_epiproctophora ===
* Fat, round ended body and long legs make them look spider-like. Mouthparts form a ladle-shaped mask in front of face. -> spider_mud_eye # mediaUrls: ["/taxonomy/walta/media/mudeyeface.jpg"]
* Relatively elongate body, NOT spider-like. Mouthparts flat, folded under 'chin' -> node_63 # mediaUrls: ["/taxonomy/walta/media/mouthpartsfolded.jpg"]

=== node_63 ===
* Medium sized nymphs with club or sausage shaped antennae. Sluggish, often green or brown. No obvious spines on the edges of abdominal segments. -> gomphidae # mediaUrls: []
* Large nymphs with tiny antennae and with spines on the edges of the abdominal segments. -> node_64 # mediaUrls: []

=== node_64 ===
* Dark mottled nymphs usually with large spines on the edges of the abdominal segments. Central bum spine pointed. -> telephlebiidae # mediaUrls: []
* Green or brown nymphs. Central bum spine with a cut-off end. This can be seen even on small nymphs. -> aeshnidae # mediaUrls: []

=== k_larval ===
* mouthparts straight and longer than head -> neuroptera # mediaUrls: ["/taxonomy/walta/media/lacewinglarvae.gif"]
* mouthparts short and curved -> node_65 # mediaUrls: ["/taxonomy/walta/media/shortcurvedmouth.gif"]

=== node_65 ===
* robust animal, distinctive, abdominal projections robust (see image), found in cobbly rivers -> corydalidae # mediaUrls: ["/taxonomy/walta/media/toebiter.gif"]
* slender animal, or with slender abdominal projections (dangly bits), found in pools and wetlands -> k_coleoptera_larvae # mediaUrls: ["/taxonomy/walta/media/beetlelarvae.gif"]

=== k_coleoptera_larvae ===
* Beetle larvae swim actively with all legs; usually with wide flat heads and prominent mandibles; middle of the head sometimes projected forwards like a nose on smaller examples; may be biting and killing other animals in the tray. -> k_dytiscidae_L # mediaUrls: ["/taxonomy/walta/media/dytiscidae_larva_m1.mp4"]
* Beetle larvae crawl slowly, or, may propel themselves by longitudinal thrashing of the body. -> node_66 # mediaUrls: []

=== k_dytiscidae_L ===
* Larvae larger than 12mm long. -> node_67 # mediaUrls: []
* Larvae shorter than 12mm long. -> node_68 # mediaUrls: []

=== node_67 ===
* Larvae without a pair of tails. Last segment tapers to a point and is fringed with swimming hairs. -> taper_tailed_tiger_larvae # mediaUrls: []
* Larvae with two distinct tails -> two_tailed_tiger_larvae # mediaUrls: []

=== node_68 ===
* Larvae with a strong 'nose'. -> nosey_tiger_larvae # mediaUrls: []
* Larvae without a nose.  -> node_69 # mediaUrls: []

=== node_69 ===
* Larvae strong swimmers, constantly moving, obvious tails. -> swimming_water_tiger_larvae # mediaUrls: []
* Larvae crawl slowly, tails minute. -> crawling_water_tiger_larvae # mediaUrls: []

=== node_66 ===
* Strongly flattened, round, slater-like larvae, on rocks. -> sclerocyphon # mediaUrls: []
* Not as above. -> node_70 # mediaUrls: []

=== node_70 ===
* Elongate slow moving larvae with hard bodies and short legs; often dark coloured, flowing water. -> k_crunchy_beetle_larvae # mediaUrls: []
* Soft bodied larvae, still and flowing water. -> node_71 # mediaUrls: []

=== k_crunchy_beetle_larvae ===
* Flattened, cockroach-like larvae with simple bodies and long antennae. Yellow, brown to black.  -> scirtidae # mediaUrls: []
* Larvae with short antennae, not obviously flattened. -> node_72 # mediaUrls: []

=== node_72 ===
* Small to tiny and often comma shaped. -> elmidae_larvae # mediaUrls: []
* Larger more elongate larvae shiny, water repellent skin. Sometimes stuck in water surface tension. -> byrrocryptus # mediaUrls: []

=== node_71 ===
* Elongate, slender larvae with feathery lateral gills and terminal anal claws (see picture); head dark, body pale.  -> gyrinidae_larvae # mediaUrls: ["/taxonomy/walta/media/gyrinidae_larvae_01.jpg"]
* Robust larvae, without feathery gills but may have long lateral filaments; large head with prominent mandibles. -> node_73 # mediaUrls: []

=== node_73 ===
* Abdomen with long lateral filaments. -> berosus # mediaUrls: []
* Not as above. -> node_74 # mediaUrls: []

=== node_74 ===
* Large beetle larvae (up to 50mm). Dark head that is angled upwards. -> hydrophilus # mediaUrls: []
* Not as above. -> water_scavenger_beetle_larvae # mediaUrls: []

=== node_41 ===
* with two tails -> node_75 # mediaUrls: ["/taxonomy/walta/media/stoneflynymph.gif"]
* with three tails -> node_76 # mediaUrls: ["/taxonomy/walta/media/threetails.gif"]

=== node_75 ===
* with compound eyes (like a mirror ball upclose) and wing buds (except on very young animals) -> k_plecoptera # mediaUrls: ["/taxonomy/walta/media/stoneflynymph.gif"]
* simple eyes (several dots), never with wing pads -> k_coleoptera_larvae # mediaUrls: ["/taxonomy/walta/media/swimming_water_tiger_larvae_01.jpg"]

=== k_plecoptera ===
* Large nymphs up to 40mm usually bright green, orange or blue. Animals have gills along the side of the abdomen. -> eustheniidae # mediaUrls: ["/taxonomy/walta/media/sidegills.jpg"]
* Smaller nymphs, less flamboyantly coloured, with gills on the tip of the abdomen or with no visible gills. -> node_77 # mediaUrls: []

=== node_77 ===
* Nymphs with two long tails. (These could be broken leaving only ‘stumps’). Gills either absent or look like a tuft or pom-pom at the end of the abdomen. -> node_78 # mediaUrls: []
* Nymphs with short tails, shorter than half the length of the abdomen. Only 3 or 5 gills, which are similar in length and thickness to the tails. -> node_79 # mediaUrls: []

=== node_78 ===
* External gills form tuft at the tip of the abdomen earning them the common name of 'fluffy bums'. Often wag their abdomen to oxygenate the gills. -> node_80 # mediaUrls: []
* Smaller nymphs with no gills on the tip of the abdomen. May also wag, but don't have fluffy gills. -> notonemouridae # mediaUrls: []

=== node_80 ===
* Smaller nymphs, brown or black with a single row or ridge of triangular projections along their back. -> riekoperla # mediaUrls: []
* No triangular projections along their back. -> node_81 # mediaUrls: []

=== node_81 ===
* Large, sprawling nymphs with hairy legs, hairs dark and conspicuous. Often with high contrast patterns  -> hairy_sprawler # mediaUrls: []
* Not as above. -> node_82 # mediaUrls: []

=== node_82 ===
* Large, sprawling nymphs, hairs pale if present. Blond, never darkly patterned. -> illiesoperla # mediaUrls: []
* Not as above. -> gripops_or_fluffy_bums # mediaUrls: []

=== node_79 ===
* Nymphs with a double row of spines along their backs. -> acruroperla_atra # mediaUrls: []
* Nymphs without a double row of spines. -> austroperlids # mediaUrls: []

=== node_76 ===
* tails flattened or broad, jaw large and folded away under head -> k_odonata # mediaUrls: ["/taxonomy/walta/media/damselfly.gif"]
* tails thin, round in cross section -> k_ephemeroptera # mediaUrls: ["/taxonomy/walta/media/mayfly.gif"]

=== k_ephemeroptera ===
* Nymphs with gills along the side of the abdomen. -> node_83 # mediaUrls: []
* Nymphs with no visible gills along the sides of the abdomen; gill covers over part of the abdomen; gill covers can look like wing buds but are always behind the last pair of legs. -> node_84 # mediaUrls: []

=== node_83 ===
* Robust dark brown nymphs with alternating spiny V-shaped gills and smaller feathery gills. Move with a distinct rocking horse motion. Large thorax giving a hunched appearance. -> coloburiscoides # mediaUrls: []
* Not as above. -> node_85 # mediaUrls: []

=== node_85 ===
* Large nymphs with helmet-like heads and prominent eyes; two different types of gill which are flicked in sync; crawl slowly but can swim rapidly. -> mirawara # mediaUrls: []
* Not as above head not helmet like, upper and lower gills similar. -> node_86 # mediaUrls: []

=== node_86 ===
* Nymphs usually run rather than swim, but can 'dolphin' clumsily if disturbed. Conspicuously flattened nymphs, head square. Legs sprawling with wide, flat femurs. -> k_leptophlebiidae # mediaUrls: []
* Nymphs are fast swimmers, but swim in bursts like tiny fish. Nymphs not flattened or sprawling, head bullet shaped. Tails fringed with hairs.  -> node_87 # mediaUrls: []

=== k_leptophlebiidae ===
* With a conspicuous set of horns. -> jappa # mediaUrls: []
* Not as above. -> node_88 # mediaUrls: []

=== node_88 ===
* Gills fluffy, each one ending in many fingers making them look like tinsel.  -> atalophlebia # mediaUrls: []
* Not as above. -> leptophlebs # mediaUrls: []

=== node_87 ===
* Large nymphs up to 17mm. Antennae shorter than head. Rare. -> siphlonuridae # mediaUrls: []
* Small nymphs less than 10mm. Antennae longer than head. Common. -> baetidae # mediaUrls: []

=== node_84 ===
* Very small <5mm grey brown nymphs with a fuzzy silt covered appearance. Slow moving but may swim lazily. Flat gill covers large, meeting along the midline like a mini skirt. -> caenidae # mediaUrls: []
* Larger nymphs with a camouflage pattern and eyes which may appear to shine in bright light. Rarely crawl but swim rapidly. Gill covers small, elliptical, not meeting in the middle.  -> tasmanophlebia # mediaUrls: []

=== k_worm_like ===
* segmented -> node_89 # mediaUrls: ["/taxonomy/walta/media/segmented.gif"]
* not segmented -> node_90 # mediaUrls: ["/taxonomy/walta/media/notsegmented.gif"]

=== node_89 ===
* without suction cups -> node_91 # mediaUrls: ["/taxonomy/walta/media/segmented.gif"]
* with suction cups on either end of the body -> node_92 # mediaUrls: []

=== node_91 ===
* with hard mouthparts (these can be inside the head and difficult to see) -> k_diptera # mediaUrls: ["/taxonomy/walta/media/trueflies.gif"]
* without hard mouthparts -> oligochaeta # mediaUrls: ["/taxonomy/walta/media/nohardmouth.gif"]

=== k_diptera ===
* Maggots break the surface of the water to breathe; their bodies are buoyant in deeper water (floaters). -> node_93 # mediaUrls: []
* Maggots don't need contact with the water surface, bodies are not buoyant in deeper water, may still be active and swim past the surface (sinkers). -> k_maggots # mediaUrls: []

=== node_93 ===
* Animal has obviously sclerotised (armoured or hardened) body plates, either the whole body or bands on all segments. -> node_94 # mediaUrls: []
* Animal mostly soft bodied, although it may have sclerotised plates on its head and abdomen.  -> node_95 # mediaUrls: []

=== node_94 ===
* All of body sclerotised (darkened and toughened skin), animal can grow to 20mm. -> stratiomyidae # mediaUrls: []
* Only bands of the upper surface of the body are sclerotised, smaller than 6mm. -> psychodidae # mediaUrls: []

=== node_95 ===
* Animals with obviously sclerotised (dark) head capsule and final segments. -> node_96 # mediaUrls: []
* Not as above. -> node_97 # mediaUrls: []

=== node_96 ===
* Animal restricted to the water surface, bent 'U' posture at rest, final segments usually out of the water so they distort the surface. -> dixidae # mediaUrls: []
* Often dive when disturbed, leaving the surface quite readily, move in a rapid tumbling or wriggling motion. -> culicidae # mediaUrls: []

=== node_97 ===
* Animal with a distinctive elongate tail (a snorkel). -> syrphidae # mediaUrls: []
* Animal with very few characteristics of note, maggot-like in appearance. -> ephydridae_and_sciomyzidae # mediaUrls: []

=== k_maggots ===
* Bleffs (very distinctive, see picture), only found in fast flowing water. -> blephariceridae # mediaUrls: ["/taxonomy/walta/media/blephariceridae_01.jpg"]
* Not a bleff. -> node_98 # mediaUrls: []

=== node_98 ===
* Animal with a head capsule; long, thin, worm-like or leech-like body form and movement. -> node_99 # mediaUrls: []
* Animal without a head capsule; traditionally maggot-like in body form and movement. -> node_100 # mediaUrls: []

=== node_99 ===
* Animal moves like a leech, rarely losing hold of the substrate, abdomen broadly swollen giving a 'chicken drumstick' appearance, expandable antennae modified to form broad 'antlers' for filter feeding; typical of fast flowing waters with solid surfaces. -> simuliidae # mediaUrls: []
* Animal moves by coiling and uncoiling, or by rapid undulations. Unattached to the substrate; abdomen may be swollen but only the very end; antennae small and simple if present. -> k_chironomid # mediaUrls: []

=== k_chironomid ===
* Animals obviously red. -> Chironomus # mediaUrls: []
* Colour variable but not red. -> node_101 # mediaUrls: []

=== node_101 ===
* Animal looks like a swimming eyelash, with stiff, snake-like movements. -> ceratopogonidae # mediaUrls: []
* Not as above. -> node_102 # mediaUrls: []

=== node_102 ===
* Head capsule obvious, small prolegs at both ends of the animal, rarely longer than 7mm. -> chironomid # mediaUrls: []
* Head capsule retractable, no pro-legs, sometimes with a set of hairy, feathered or fleshy appendages at the posterior end, may be covered in downy hairs, often longer than 5mm. -> tipulidae # mediaUrls: []

=== node_100 ===
* Appendages along both sides of the animal (see picture). -> athericidae # mediaUrls: ["/taxonomy/walta/media/athericidae_01.jpg"]
* Animal without appendages or only present on the final segments of the animal. -> tabanidae_dolichopodidae_empididae_some_tipulidae # mediaUrls: []

=== node_92 ===
* without a hardened head capsule -> hirudinea # mediaUrls: ["/taxonomy/walta/media/leeches.gif"]
* with a head capsule -> k_diptera # mediaUrls: ["/taxonomy/walta/media/blackflylarva.gif"]

=== node_90 ===
* flattened, short and slimy -> turbellaria # mediaUrls: ["/taxonomy/walta/media/flatshortslimy.gif"]
* not flattened, long and thin -> node_103 # mediaUrls: ["/taxonomy/walta/media/longthinworm.gif"]

=== node_103 ===
* shorter than 1.5cm, tapering -> nematoda # mediaUrls: ["/taxonomy/walta/media/short_tapering.gif"]
* longer than 1.5cm -> nematomorpha # mediaUrls: ["/taxonomy/walta/media/horsehairworm.gif"]

/* Taxa Nodes */

=== flat_snails ===
# taxonId: "WB188"
# name: "Planorbidae"
# scientificName: [{"taxonomicLevel":"class","name":"Gastropoda"},{"taxonomicLevel":"family","name":"Planorbidae"},{"taxonomicLevel":"alt","name":"Planorbidae"}]
# commonName: "flat snails"
# size: 6
# signalScore: 6
# habitat: "Wetlands / Rivers, temporary waters."
# movement: "Slow, will retract into shell and drop off vegetation, so it is sometimes worth panning through sand at the end of a live pick to see if you can find them."
# confusedWith: "Nothing, really distinctive. Etymology: 'plan'-flat + 'orbi'-circle."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/flatsnails_01.jpg"]
# description: ""
-> DONE

=== potamopyrgus_antipodarum ===
# taxonId: "WB192"
# name: "Potamopyrgus antipodarum"
# scientificName: [{"taxonomicLevel":"class","name":"Gastropoda"},{"taxonomicLevel":"family","name":"Hydrobiidae"},{"taxonomicLevel":"species","name":"Potamopyrgus antipodarum"}]
# commonName: "New Zealand mud snail"
# size: 4
# signalScore: 1
# habitat: "In very large numbers in impacted, high nutrient streams. INTRODUCED SPECIES (from New Zealand)"
# movement: "Slow, like a snail."
# confusedWith: "Some snails from the same family in healthy streams, see Genus Beddomeia, family Hydrobiidae, at the end of this section."
# taxonomicLevel: "species"
# mediaUrls: ["/taxonomy/walta/media/potamopyrgus_antipodarum_01.jpg","/taxonomy/walta/media/potamopyrgus_antipodarum_02.jpg","/taxonomy/walta/media/potamopyrgus_02.gif"]
# description: ""
-> DONE

=== physa_acuta ===
# taxonId: "WB186"
# name: "Physa acuta"
# scientificName: [{"taxonomicLevel":"class","name":"Gastropoda"},{"taxonomicLevel":"family","name":"Physidae"},{"taxonomicLevel":"species","name":"Physa acuta"}]
# commonName: "Physa acuta"
# size: 10
# signalScore: 1
# habitat: "Flowing water or wetlands widespread. INTRODUCED SPECIES (from the USA)"
# movement: "Fast... for a snail."
# confusedWith: "Planorbids can look very similar, but Physa acuta has a mottled mantle that is usually visible through the shell."
# taxonomicLevel: "species"
# mediaUrls: ["/taxonomy/walta/media/physa_acuta_01.jpg","/taxonomy/walta/media/Physa_acuta_closeup.jpg"]
# description: ""
-> DONE

=== planorbids ===
# taxonId: "WB189"
# name: "Planorbids"
# scientificName: [{"taxonomicLevel":"class","name":"Gastropoda"},{"taxonomicLevel":"family","name":"Planorbidae"},{"taxonomicLevel":"alt","name":"Planorbids"}]
# commonName: "Planorbids"
# size: 15
# signalScore: 2
# habitat: "Wetlands / rivers with slow water and lots of water plants. Common and diverse."
# movement: "Slow and steady."
# confusedWith: "Algae covered shells might be difficult to distinguish from Physa acuta. These Snails are fairly diverse, so they might not look exactly the same as those in the picture; some have ornamentation or flattened tops."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/planorbids_01.jpg"]
# description: ""
-> DONE

=== lymnaeidae ===
# taxonId: "WB184"
# name: "Lymnaeidae"
# scientificName: [{"taxonomicLevel":"class","name":"Gastropoda"},{"taxonomicLevel":"family","name":"Lymnaeidae"}]
# commonName: "Lim nay ids"
# size: 40
# signalScore: 1
# habitat: "Wetlands / slower lowland rivers."
# movement: "Snail's pace."
# confusedWith: "Nothing, most other dextral snails are much smaller. Lymnaeids can be mottled but they are dextral so they cannot be confused with Physa acuta."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/lymnaeidae_01.jpg"]
# description: ""
-> DONE

=== ancylidae ===
# taxonId: "WB183"
# name: "Ancylidae"
# scientificName: [{"taxonomicLevel":"class","name":"Gastropoda"},{"taxonomicLevel":"family","name":"Ancylidae"}]
# commonName: "Freshwater limpets"
# size: 4
# signalScore: 4
# habitat: "Both still and flowing waters, on rocks or vegetation. Common."
# movement: "Very slow. Can stick to the sorting tray, so they are worth checking for after a live-pick once you have tipped the rest of the sample out."
# confusedWith: "Nothing, but they can be very small and the shell can be transparent so they are sometimes hard to see."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/ancylidae.jpg"]
# description: ""
-> DONE

=== hyriidae ===
# taxonId: "WB178"
# name: "Hyriidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"phylum","name":"Mollusca"},{"taxonomicLevel":"class","name":"Bivalvia"},{"taxonomicLevel":"family","name":"Hyriidae"}]
# commonName: "Freshwater mussels"
# size: 120
# signalScore: 5
# habitat: "Often found in groups, almost completely dug into the sandy bottom of slow flowing rivers."
# movement: "Not really."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hyriidae_01.jpg"]
# description: ""
-> DONE

=== sphaeriidae_and_corbiculidae ===
# taxonId: "WB179"
# name: "Sphaeriidae and Corbiculidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"phylum","name":"Mollusca"},{"taxonomicLevel":"family","name":"Sphaeriidae and Corbiculidae"}]
# commonName: "Basket and pea shells"
# size: 25
# signalScore: 4
# habitat: "Often found in groups, almost completely dug into the sandy bottom of slow flowing rivers.Flowing and still waters, usually amongst sand or finer sediments. Can be found in large numbers. Common."
# movement: "Usually doesn't."
# confusedWith: "Small Hyriidae, but Hyriidae are usually asymmetrical and much larger."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/sphaeriidae_and_corbiculidae_01.jpg"]
# description: ""
-> DONE

=== parastacidae ===
# taxonId: "WB3"
# name: "Parastacidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Decapoda"},{"taxonomicLevel":"family","name":"Parastacidae"}]
# commonName: "freshwater crayfish or yabbies"
# size: 300
# signalScore: 4
# habitat: "Crayfish in rivers (with spines) yabbies in wetlands/pools (more leathery)."
# movement: "walking, with sudden flips when disturbed. "
# confusedWith: "\n            Nothing, very distinctive. We have left crayfish and yabbies grouped together\n            because they mostly turn up as juveniles in samples and are difficult to separate when young.\n          "
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/parastacide_01.jpg","/taxonomy/walta/media/parastacide_02.jpg"]
# description: ""
-> DONE

=== macrobrachium ===
# taxonId: "WB6"
# name: "Macrobrachium"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Decapoda"},{"taxonomicLevel":"family","name":"Palaemonidae"},{"taxonomicLevel":"genus","name":"Macrobrachium"}]
# commonName: "freshwater prawn"
# size: 50
# signalScore: 4
# habitat: "Lowland rivers on wood or amongst water weeds."
# movement: "Walking, flips in shallow water."
# confusedWith: "Atyidae, but pincers on second leg very distinctive when fully grown."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/macrobrachium_01.jpg"]
# description: ""
-> DONE

=== atyidae ===
# taxonId: "WB7"
# name: "Atyidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Decapoda"},{"taxonomicLevel":"family","name":"Atyidae"}]
# commonName: "glass shrimp"
# size: 35
# signalScore: 4
# habitat: "slow moving parts of rivers near wood and weeds. Common and often abundant."
# movement: "Fast, with lots of flipping when in a tray."
# confusedWith: "Palaemonidae, but front 2 pairs of Atyidae legs are shorter and usually with brushes."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/atyidae_01.jpg","/taxonomy/walta/media/atyidae_02.jpg"]
# description: ""
-> DONE

=== hymenosomatidae ===
# taxonId: "WB4"
# name: "Hymenosomatidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Decapoda"},{"taxonomicLevel":"family","name":"Hymenosomatidae"}]
# commonName: "five cent crab, false spider crab"
# size: 15
# signalScore: 3
# habitat: "Lakes, and the sluggish, estuarine ends of rivers."
# movement: "Slow. "
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hymenosomatidae_01.jpg"]
# description: ""
-> DONE

=== amphipoda ===
# taxonId: "WB11"
# name: "Amphipoda"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Amphipoda"}]
# commonName: "scuds, sideswimmers"
# size: 15
# signalScore: 3
# habitat: "Wetlands. Weeds in slower parts of rivers, or leaf packs in faster rivers. Very Common."
# movement: "Bursts of movement, usually on their sides."
# confusedWith: "Phreatoicids, but faster."
# taxonomicLevel: "class"
# mediaUrls: ["/taxonomy/walta/media/amphipoda_01.jpg","/taxonomy/walta/media/amphipoda_02.jpg","/taxonomy/walta/media/amphipoda_03.jpg"]
# description: ""
-> DONE

=== phreatoicidae ===
# taxonId: "WB10"
# name: "Phreatoicidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Isopoda"},{"taxonomicLevel":"family","name":"Phreatoicidae"}]
# commonName: "phreatoicids, cow shrimp"
# size: 25
# signalScore: 4
# habitat: "Wetlands. Rivers. Usually not common but can occur in large numbers."
# movement: "Slow walking."
# confusedWith: " Amphipods, but they are far more robust looking and slow moving."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/phreatoicidae_01.jpg","/taxonomy/walta/media/phreatoicidae_02.jpg"]
# description: ""
-> DONE

=== janiridae ===
# taxonId: "WB9"
# name: "Janiridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"class","name":"Isopoda"},{"taxonomicLevel":"family","name":"Janiridae"}]
# commonName: "water slaters"
# size: 7
# signalScore: 3
# habitat: "Wetlands and river edges. Rare."
# movement: "Slow."
# confusedWith: "If terrestrial slaters fall in they look similar. Can be extremely small."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/janiridae_01.jpg"]
# description: ""
-> DONE

=== anostraca ===
# taxonId: "WB12"
# name: "Anostraca"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"order","name":"Anostraca"}]
# commonName: "fairy shrimp"
# size: 25
# signalScore: 1
# habitat: "Wetlands, salt lakes."
# movement: "Constant with pulsing rows of legs."
# confusedWith: "Nothing, but can be difficult to definitively separate natives from pest species."
# taxonomicLevel: "order"
# mediaUrls: ["/taxonomy/walta/media/anostraca_01.jpg","/taxonomy/walta/media/anostraca_02.jpg","/taxonomy/walta/media/anostraca_03.jpg","/taxonomy/walta/media/anostraca_m1.mp4"]
# description: "\n          Native fairy shrimp (left) tend to be larger (up to 25mm) and paler coloured, while the introduced sea monkeys (right) tend to be smaller (up to 10mm) and pink or orange. Native fairy shrimp can live in fresh or salty waters, while sea monkeys prefer salty waters\n        "
-> DONE

=== notostraca ===
# taxonId: "WB14"
# name: "Notostraca"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"order","name":"Notostraca"}]
# commonName: "shield shrimp, tadpole shrimp"
# size: 40
# signalScore: 1
# habitat: "Wetlands."
# movement: "Swimming."
# confusedWith: "Nothing in wetlands ...but they do look like horseshoe crabs."
# taxonomicLevel: "order"
# mediaUrls: ["/taxonomy/walta/media/notostraca_01.jpg","/taxonomy/walta/media/notostraca_m1.mp4"]
# description: ""
-> DONE

=== conchostraca ===
# taxonId: "WB13"
# name: "Conchostraca"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Crustacea"},{"taxonomicLevel":"order","name":"Conchostraca"}]
# commonName: "clam shrimp"
# size: 8
# signalScore: 1
# habitat: "Temporary Wetlands. Common but cryptic and short lived."
# movement: "Busy, haphazard then they drop from the water column."
# confusedWith: "Some pea shells, but legs are obvious on live animals."
# taxonomicLevel: "order"
# mediaUrls: ["/taxonomy/walta/media/conchostraca_01.jpg"]
# description: ""
-> DONE

=== acarina ===
# taxonId: "WB18"
# name: "Acarina"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Chelicerata"},{"taxonomicLevel":"order","name":"Acarina"}]
# commonName: "water mites"
# size: 5
# signalScore: 5
# habitat: "Rivers, wetlands."
# movement: "Very active swimmers, legs move very fast."
# confusedWith: "Nothing else is as colourful."
# taxonomicLevel: "order"
# mediaUrls: ["/taxonomy/walta/media/acarina_01.jpg"]
# description: ""
-> DONE

=== pisauridae_and_lycosidae ===
# taxonId: "WB17"
# name: "Pisauridae and Lycosidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Chelicerata"},{"taxonomicLevel":"order","name":"Araneae"},{"taxonomicLevel":"family","name":"Pisauridae and Lycosidae"}]
# commonName: "fishing and wolf spiders"
# size: 120
# signalScore: 5
# habitat: "Edges of rivers and wetlands."
# movement: "Running rapidly on the surface, then crawling underwater leaving a silvery layer of air trapped against the body."
# confusedWith: "Terrestrial spiders, which cannot do the air layer trick or run on water as effectively."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/pisauridae_and_lycosidae_01.jpg"]
# description: ""
-> DONE

=== gyrinidae_adult ===
# taxonId: "WB49"
# name: "Gyrinidae adult"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Gyrinidae"},{"taxonomicLevel":"family","name":"Gyrinidae adult"}]
# commonName: "Whirligig beetle"
# size: 12
# signalScore: 4
# habitat: "Wetlands and river edges, common and conspicuous."
# movement: "Fast, and mainly on the surface in circular patterns, although they will dive underwater if threatened."
# confusedWith: "Nothing, movement and appearance are both very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/gyrinidae_adult_01.jpg","/taxonomy/walta/media/gyrinidae_adult_m1.mp4","/taxonomy/walta/media/gyrinidae_adult_m2.mp4"]
# description: ""
-> DONE

=== hygrobia_adult ===
# taxonId: "WB61"
# name: "Hygrobia adult"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hygrobiidae"},{"taxonomicLevel":"genus","name":"Hygrobia adult"}]
# commonName: "Screetch beetle adult"
# size: 10
# signalScore: 1
# habitat: "Wetlands. Rare. "
# movement: "Ambling swim."
# confusedWith: "Nothing, the oddly lumpy appearance is distinctive. Most will screech while being collected."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/hygrobia_adult_01.jpg"]
# description: ""
-> DONE

=== hydrophilidae_adult ===
# taxonId: "WB58"
# name: "Water scavenger beetle adult"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hydrophilidae"},{"taxonomicLevel":"alt","name":"Water scavenger beetle adult"}]
# commonName: "Water scavenger beetle adult"
# size: 35
# signalScore: 2
# habitat: "Wetlands and river edges. Common and abundant."
# movement: "Ambling swim."
# confusedWith: "Dytiscids"
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/water_scavenger_beetle_adult_01.jpg","/taxonomy/walta/media/hydrophilidae_m1.mp4"]
# description: "very variable size, can be as small as 2mm"
-> DONE

=== carabhydrus ===
# taxonId: "WB29"
# name: "Carabhydrus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Carabhydrus"}]
# commonName: "waisted diving beetle"
# size: 3
# signalScore: 7
# habitat: "Running water. Rare. "
# movement: "Less coordinated than other dytiscids"
# confusedWith: "Nothing, strong constriction of the pronotum is distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/carabhydrus_01.jpg"]
# description: ""
-> DONE

=== australphilus ===
# taxonId: "WB28"
# name: "Australphilus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Australphilus"}]
# commonName: "Australphilus"
# size: 3
# signalScore: 7
# habitat: "Running water. Rare. "
# movement: "Strong fast swimmer."
# confusedWith: "Nothing, strong colour pattern and tapered body are distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/australphilus_01.jpg"]
# description: ""
-> DONE

=== little_diving_beetles ===
# taxonId: "WB36"
# name: "little diving beetles"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"little diving beetles"}]
# commonName: "little diving beetles"
# size: 4
# signalScore: 1
# habitat: "Wetlands and slow moving water in rivers. "
# movement: "Strong swimmer using hind legs, rarely stops moving. "
# confusedWith: "Nothing, most of the medium beetles should be noticeably larger."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/little_diving_beetles_01.jpg","/taxonomy/walta/media/little_diving_beetles_02.jpg"]
# description: ""
-> DONE

=== mixed_diving_beetles ===
# taxonId: "WB37"
# name: "mixed diving beetles"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"mixed diving beetles"}]
# commonName: "mixed diving beetles"
# size: 8
# signalScore: 1
# habitat: "Wetlands and slow moving water in rivers. "
# movement: "Strong swimmer using hind legs. "
# confusedWith: "Anything with a pattern in this size class is considered the same."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/mixed_diving_beetles_01.jpg","/taxonomy/walta/media/mixed_diving_beetles_02.jpg","/taxonomy/walta/media/mixed_diving_beetles_03.jpg"]
# description: ""
-> DONE

=== stealth_diving_beetles ===
# taxonId: "WB38"
# name: "stealth diving beetles"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"stealth diving beetles"}]
# commonName: "stealth diving beetles"
# size: 10
# signalScore: 1
# habitat: "Wetlands and Rivers. "
# movement: "Some of these may move quite slowly for diving beetles."
# confusedWith: "Nothing, black. May sometimes have a light coloured spot on the head."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/stealth_diving_beetles_01.jpg"]
# description: ""
-> DONE

=== lancetes ===
# taxonId: "WB32"
# name: "Lancetes"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Lancetes"}]
# commonName: "Lancetes"
# size: 10
# signalScore: 2
# habitat: "Wetlands and rivers. "
# movement: "Strong swimmer using hind legs."
# confusedWith: "Nothing, very distinctive stripes."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/lancetes_01.jpg","/taxonomy/walta/media/lancetes_m1.mp4"]
# description: ""
-> DONE

=== eretes ===
# taxonId: "WB30"
# name: "Eretes"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Eretes"}]
# commonName: "Eretes"
# size: 16
# signalScore: 1
# habitat: "Wetlands and slow moving water in rivers. "
# movement: "Strong swimmer using hind legs."
# confusedWith: "Rhantus, but colour patterns are different, note Eretes has a pale coloured underside."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/eretes_01.jpg"]
# description: ""
-> DONE

=== rhantus ===
# taxonId: "WB34"
# name: "Rhantus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Rhantus"}]
# commonName: "Rhantus"
# size: 14
# signalScore: 1
# habitat: "Wetlands and slow moving water in rivers. "
# movement: "Strong swimmer using hind legs."
# confusedWith: "Eretes, see above."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/rhantus_01.jpg"]
# description: ""
-> DONE

=== hyderodes ===
# taxonId: "WB31"
# name: "Hyderodes"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Hyderodes"}]
# commonName: "Hyderodes"
# size: 20
# signalScore: 2
# habitat: "Temporary wetlands. "
# movement: "Strong swimmer using hind legs."
# confusedWith: "Large hydrophilid beetles, but hydrophilids are flat underneath."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/hyderodes_01.jpg"]
# description: ""
-> DONE

=== spencerhydrus ===
# taxonId: "WB35"
# name: "Spencerhydrus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Spencerhydrus"}]
# commonName: "Spencerhydrus"
# size: 18
# signalScore: 5
# habitat: "Temporary wetlands.  "
# movement: "Strong swimmer using hind legs."
# confusedWith: "Onychohydrus, but Onychohydrus is usually larger and pale underneath. (Photo is actually Onychohydrus ...but they are very, very similar)."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/spencerhydrus_01.jpg"]
# description: ""
-> DONE

=== onychohydrus ===
# taxonId: "WB33"
# name: "Onychohydrus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"genus","name":"Onychohydrus"}]
# commonName: "Onychohydrus"
# size: 28
# signalScore: 5
# habitat: "Temporary wetlands. "
# movement: "Strong swimmer using hind legs."
# confusedWith: "Spencerhydrus, but Spencerhydrus is smaller and dark/black underneath."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/onychohydrus_01.jpg"]
# description: ""
-> DONE

=== curculionidae ===
# taxonId: "WB26"
# name: "Curculionidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Curculionidae"}]
# commonName: "weevils"
# size: 9
# signalScore: 2
# habitat: "Vegetation in wetlands."
# movement: "Slow, ponderous."
# confusedWith: "Nothing, it has a distinctive nose."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/curculionidae_01.jpg","/taxonomy/walta/media/curculionidae_02.jpg"]
# description: ""
-> DONE

=== elmidae_adult ===
# taxonId: "WB46"
# name: "Elmidae adult"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Elmidae"},{"taxonomicLevel":"family","name":"Elmidae adult"}]
# commonName: "Riffle beetle"
# size: 6
# signalScore: 7
# habitat: "Cool flowing waters (riffles), often found on wood, common but hard to see. "
# movement: "Hangs in the water or clings to detritus, slow."
# confusedWith: "Nothing, very few beetles are as slow or with such impressive claws. Often overlooked due to size."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/elmidae_adult_01.jpg","/taxonomy/walta/media/elmidae_m1.mp4"]
# description: ""
-> DONE

=== hydraenidae_and_hydrochidae ===
# taxonId: "WB53"
# name: "Hydraenidae and Hydrochidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hydraenidae and Hydrochidae"}]
# commonName: "Crawling water beetle"
# size: 4
# signalScore: 3
# habitat: "Wetlands, wet rock surfaces near waterfalls. Uncommon, but can be abundant. Hydraenids in wetlands can walk on the water undersurface. "
# movement: "Slow walking."
# confusedWith: "Nothing, quite distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hydraenidae_and_hydrochidae_01.jpg"]
# description: ""
-> DONE

=== helochares ===
# taxonId: "WB56"
# name: "Helochares"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hydrophilidae"},{"taxonomicLevel":"genus","name":"Helochares"}]
# commonName: "Helochares"
# size: 8
# signalScore: 2
# habitat: "Wetlands, river edges."
# movement: "Slow, sometimes walk on the water undersurface."
# confusedWith: "Other hydrophilids, but Helochares does not swim."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/helochares_01.jpg","/taxonomy/walta/media/helochares_m1.mp4"]
# description: ""
-> DONE

=== gerridae ===
# taxonId: "WB109"
# name: "Gerridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Gerridae"}]
# commonName: "Water striders"
# size: 70
# signalScore: 4
# habitat: "Wetlands and river edges. Common."
# movement: "Fast, jerky."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/gerridae_01.jpg"]
# description: ""
-> DONE

=== veliidae_mesoveliidae_and_hebridae ===
# taxonId: "WB120"
# name: "Veliidae, Mesoveliidae and Hebridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Veliidae, Mesoveliidae and Hebridae"}]
# commonName: "Water treader"
# size: 5
# signalScore: 3
# habitat: "Wetlands and river edges. Very common."
# movement: "Fast, look a bit like they have been sped up."
# confusedWith: "Nothing. If they are in large numbers and are dark or black they are probably Veliidae (two lower photos). Pale individuals are likely to be Mesoveliidae (top photo). Hebridae are relatively rare."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/veliidae_Mesoveliidae_and_herbridae_01.jpg","/taxonomy/walta/media/veliidae_m1.mp4"]
# description: ""
-> DONE

=== hydrometridae ===
# taxonId: "WB110"
# name: "Hydrometridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Hydrometridae"}]
# commonName: "Water measurers"
# size: 15
# signalScore: 3
# habitat: "Wetlands, still water. Uncommon, but very cool."
# movement: "Slow moving."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hydrometridae_01.jpg"]
# description: ""
-> DONE

=== gelastocoridae ===
# taxonId: "WB108"
# name: "Gelastocoridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Gelastocoridae"}]
# commonName: "Toad bug"
# size: 10
# signalScore: 5
# habitat: "Wetlands and river edges. Rare."
# movement: "Slow, ponderous, but surprisingly can jump."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/gelastocoridae_01.jpg"]
# description: ""
-> DONE

=== ranatra ===
# taxonId: "WB115"
# name: "Ranatra"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Nepidae"},{"taxonomicLevel":"genus","name":"Ranatra"}]
# commonName: "Slender water scorpions/stick bug"
# size: 90
# signalScore: 3
# habitat: "Still water. Uncommon but spectacular."
# movement: "Swims awkwardly or not at all (sit-and-wait predator)."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/ranatra_01.jpg","/taxonomy/walta/media/ranatra_m1.mp4"]
# description: ""
-> DONE

=== laccotrephes ===
# taxonId: "WB114"
# name: "Laccotrephes"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Nepidae"},{"taxonomicLevel":"genus","name":"Laccotrephes"}]
# commonName: "Leafy water scorpion"
# size: 90
# signalScore: 3
# habitat: "Wetlands. Still water. Uncommon but spectacular."
# movement: "Slow or not at all (sit-and-wait predator)."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/laccotrephes_01.jpg"]
# description: ""
-> DONE

=== pleidae ===
# taxonId: "WB119"
# name: "Pleidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Pleidae"}]
# commonName: "Pygmy backswimmer"
# size: 3
# signalScore: 2
# habitat: "Wetlands and river edges. Common but cryptic."
# movement: "Swift then stopped."
# confusedWith: "Immature Notonectidae."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/pleidae_01.jpg"]
# description: ""
-> DONE

=== enithares ===
# taxonId: "WB118"
# name: "Enithares"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Notonectidae"},{"taxonomicLevel":"genus","name":"Enithares"}]
# commonName: "Robust backswimmer"
# size: 12
# signalScore: 1
# habitat: "Wetlands and slow river sections. Still water, very common."
# movement: "In bursts. Still when it is at the surface re-filling air supplies."
# confusedWith: "Slender backswimmers Anisops."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/enithares_01.jpg","/taxonomy/walta/media/enithares_m1.mp4"]
# description: ""
-> DONE

=== anisops ===
# taxonId: "WB117"
# name: "Anisops"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Notonectidae"},{"taxonomicLevel":"genus","name":"Anisops"}]
# commonName: "Slender backswimmer"
# size: 9
# signalScore: 1
# habitat: "Wetlands and slow river sections. Still water, very common"
# movement: "Deliberate strokes of swimming legs, sometimes still, mid-water. Less relaxed in an ice cube tray."
# confusedWith: "Younger robust backswimmers Enithares."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/anisops_01.jpg","/taxonomy/walta/media/anisops_m1.mp4"]
# description: ""
-> DONE

=== naucoris ===
# taxonId: "WB112"
# name: "Naucoris"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Naucoridae"},{"taxonomicLevel":"genus","name":"Naucoris"}]
# commonName: "Creeping water bugs"
# size: 12
# signalScore: 2
# habitat: "Wetlands and weedy river edges. Common."
# movement: "Slow, may crawl or swim."
# confusedWith: "Giant water bugs (Belostomatidae)"
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/naucoris_01.jpg"]
# description: ""
-> DONE

=== diplonychus ===
# taxonId: "WB102"
# name: "Diplonychus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Belostomatidae"},{"taxonomicLevel":"genus","name":"Diplonychus"}]
# commonName: "Giant water bug"
# size: 30
# signalScore: 1
# habitat: "Wetlands. Uncommon."
# movement: "Slow, may crawl or swim."
# confusedWith: "Creeping water bugs (Naucoridae)."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/diplonychus_01.jpg"]
# description: ""
-> DONE

=== diaprepocoris_barycephala ===
# taxonId: "WB105"
# name: "Diaprepocoris barycephala"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Corixidae"},{"taxonomicLevel":"species","name":"Diaprepocoris barycephala"}]
# commonName: "Barry four-eyes"
# size: 8
# signalScore: 6
# habitat: "Wetlands and slow river sections. Slow moving water. "
# movement: "In bursts."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "species"
# mediaUrls: ["/taxonomy/walta/media/diaprepocoris_01.jpg"]
# description: ""
-> DONE

=== sigara ===
# taxonId: "WB107"
# name: "Sigara"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Corixidae"},{"taxonomicLevel":"genus","name":"Sigara"}]
# commonName: "Striped boatman"
# size: 8
# signalScore: 3
# habitat: "Wetlands and slow river sections. Slow moving water. Common."
# movement: "In bursts."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/sigara_01.jpg"]
# description: ""
-> DONE

=== micronecta ===
# taxonId: "WB106"
# name: "Micronecta"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Corixidae"},{"taxonomicLevel":"genus","name":"Micronecta"}]
# commonName: "Little brindle boatman"
# size: 4
# signalScore: 2
# habitat: "Wetlands and slow river sections. Very very common. Often found in large numbers (see soup picture)."
# movement: "In bursts."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/micronecta_01.jpg"]
# description: ""
-> DONE

=== agraptocorixa ===
# taxonId: "WB104"
# name: "Agraptocorixa"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Hemiptera"},{"taxonomicLevel":"family","name":"Corixidae"},{"taxonomicLevel":"genus","name":"Agraptocorixa"}]
# commonName: "Static boatmen"
# size: 10
# signalScore: 6
# habitat: "Wetlands and slow river sections. Slow moving water. Common."
# movement: "In bursts."
# confusedWith: "All other boatmen if small."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/agraptocorixa_01.jpg"]
# description: ""
-> DONE

=== hydroptilidae ===
# taxonId: "WB160"
# name: "Hydroptilidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Hydroptilidae"}]
# commonName: "Micro caddis"
# size: 5
# signalScore: 4
# habitat: "All water bodies, cases vary accordingly."
# movement: "Slow moving, don't move at all immediately after being disturbed...will need 10-15 minutes to get over shock."
# confusedWith: "Nothing, very distinctive ...but small."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hydroptilidae_01.jpg"]
# description: ""
-> DONE

=== atriplectides ===
# taxonId: "WB146"
# name: "Atriplectides"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Atriplectididae"},{"taxonomicLevel":"genus","name":"Atriplectides"}]
# commonName: "Vulture caddis"
# size: 15
# signalScore: 3
# habitat: "Lakes and rivers amongst deposits of sand and debris where it finds carrion. Uncommon, but very cool."
# movement: "Slow moving."
# confusedWith: "Nothing, very distinctive. Notice the way the hind legs are held out of the way when moving, and mainly get used to latch onto food."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/atriplectides_01.jpg"]
# description: ""
-> DONE

=== agapetus ===
# taxonId: "WB155"
# name: "Agapetus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Glossosomatidae"},{"taxonomicLevel":"genus","name":"Agapetus"}]
# commonName: "Igloo caddis"
# size: 6
# signalScore: 9
# habitat: "Cool flowing waters, forest streams, riffles. Uncommon, but abundant when they do occur."
# movement: "Slow moving. "
# confusedWith: "Coarser case might look like Tasimiidae, but glossosomatids don't have tapered/triangular cases."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/agapetus_01.jpg","/taxonomy/walta/media/glossosomatidae_m1.mp4"]
# description: ""
-> DONE

=== helicopsyche ===
# taxonId: "WB157"
# name: "Helicopsyche"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Helicopsychidae"},{"taxonomicLevel":"genus","name":"Helicopsyche"}]
# commonName: "Snail caddis"
# size: 5
# signalScore: 8
# habitat: "Cool flowing water, forest streams, riffles. Rare, but can be abundant."
# movement: "Slow moving. "
# confusedWith: "Nothing, extremely distinctive ...maybe hydrobiid snails."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/helicopsyche_01.jpg"]
# description: ""
-> DONE

=== tasimiidae ===
# taxonId: "WB172"
# name: "Tasimiidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Tasimiidae"}]
# commonName: "Tasimiids"
# size: 10
# signalScore: 8
# habitat: "Small mountain streams, amongst coarse, stable substrate."
# movement: "Slow moving."
# confusedWith: "Glossosomatidae. Tasimiids have bulgy eyes if you can get close enough to look at their heads and coarser, triangular cases."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/tasimiidae_01.jpg"]
# description: ""
-> DONE

=== philorheithridae ===
# taxonId: "WB171"
# name: "Philorheithridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Philorheithridae"}]
# commonName: "Attack caddis - Highlander"
# size: 25
# signalScore: 8
# habitat: "Cold flowing water, edges, riffles. Common but sparse (as are most predators). "
# movement: "Fast moving."
# confusedWith: "Young leptocerids have a tubular sand case, but they have much longer hind legs."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/philorheithridae_01.jpg","/taxonomy/walta/media/philorheithridae_m1.mp4"]
# description: ""
-> DONE

=== attack_caddis_lowlander ===
# taxonId: "WB165"
# name: "Some Oecetis sp. (Leptoceridae) and Odontoceridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"genus","name":"Oecetis"},{"name":"Some Oecetis sp. (Leptoceridae) and Odontoceridae"}]
# commonName: "Attack caddis - lowlander"
# size: 25
# signalScore: 8
# habitat: "Cold flowing water, edges, riffles. Common but sparse (as are most predators). "
# movement: "Fast moving."
# confusedWith: "Young leptocerids have a tubular sand case, but they have much longer hind legs."
# taxonomicLevel: ""
# mediaUrls: ["/taxonomy/walta/media/oecetis_01.jpg"]
# description: ""
-> DONE

=== anisocentropus ===
# taxonId: "WB148"
# name: "Anisocentropus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Calamoceratidae"},{"taxonomicLevel":"genus","name":"Anisocentropus"}]
# commonName: "Sleeping bag caddis"
# size: 20
# signalScore: 7
# habitat: "Slow flowing water, backwaters, edges, in leaf packs. Uncommon. "
# movement: "Slow moving. "
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/anisocentropus_01.jpg"]
# description: ""
-> DONE

=== caenota_plicata ===
# taxonId: "WB150"
# name: "Caenota plicata"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Calocidae"},{"name":"Caenota plicata"}]
# commonName: "Shingle caddis"
# size: 20
# signalScore: 7
# habitat: "Slow flowing water, backwaters, edges, in leaf packs. Uncommon."
# movement: "Slow moving. "
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: ""
# mediaUrls: ["/taxonomy/walta/media/caenota_plicata_01.jpg"]
# description: ""
-> DONE

=== lectrides_varians ===
# taxonId: "WB162"
# name: "Lectrides varians"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"species","name":"Lectrides varians"}]
# commonName: "Flat shack caddis"
# size: 25
# signalScore: 4
# habitat: "Wetlands, lakes and pools in rivers. Common and often abundant."
# movement: "Slow ungainly with waiving legs."
# confusedWith: "Case is superficially similar to the shingle caddis, but Lectrides' cases are messy and lack the neat double row of leaf plates."
# taxonomicLevel: "species"
# mediaUrls: ["/taxonomy/walta/media/lectrides_varians_01.jpg"]
# description: ""
-> DONE

=== conoesucidae_calocidae_and_helicophidae ===
# taxonId: "WB151"
# name: "Conoesucidae, Calocidae and Helicophidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Conoesucidae, Calocidae and Helicophidae"}]
# commonName: "Bullet caddis"
# size: 13
# signalScore: 7
# habitat: "Cool flowing water, riffles."
# movement: "Slow moving. "
# confusedWith: "Young leptocerids; the distinction between long and short hind legs is not as great with juveniles."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/conoesucidae_calocidae_and_helicophidae_01.jpg","/taxonomy/walta/media/conoesucidae_calocidae_and_helicophidae_02.jpg"]
# description: ""
-> DONE

=== triplectides ===
# taxonId: "WB168"
# name: "Triplectides"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"genus","name":"Triplectides"}]
# commonName: "Stick caddis"
# size: 30
# signalScore: 4
# habitat: "Wetlands, lakes, slow flowing sections in rivers. Common and often abundant."
# movement: "Ungainly crawl."
# confusedWith: "All stick cases are from the Genus Triplectides, but not all Triplectides have stick cases."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/triplectides_01.jpg","/taxonomy/walta/media/triplectides_m1.mp4"]
# description: ""
-> DONE

=== log_cabin_caddis ===
# taxonId: "WB166"
# name: "Oecetis"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"genus","name":"Oecetis"},{"taxonomicLevel":"genus","name":"Oecetis"}]
# commonName: "Log cabin caddis"
# size: 20
# signalScore: 5
# habitat: "Wetlands, lakes pools in rivers."
# movement: "Hovers with flailing arms, like a helicopter."
# confusedWith: "Nothing, the case is unique."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/log_cabin_caddis_01.jpg"]
# description: ""
-> DONE

=== symphitoneuria ===
# taxonId: "WB167"
# name: "Symphitoneuria"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"genus","name":"Symphitoneuria"}]
# commonName: "Dart caddis"
# size: 15
# signalScore: 6
# habitat: "Lower end of rivers."
# movement: "Crawls on veg, when dislodged, the case falls like a dart with the heavy end first (the sandy bit)."
# confusedWith: "Nothing, case is distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/symphitoneuria_01.jpg"]
# description: ""
-> DONE

=== notalina ===
# taxonId: "WB163"
# name: "Notalina"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"genus","name":"Notalina"}]
# commonName: "Headbanger caddis"
# size: 21
# signalScore: 6
# habitat: "Wetlands, lakes and pools in rivers. Common and often abundant."
# movement: "Flailing/ headbanging movement as described."
# confusedWith: "Nothing, case and movement are distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/notalina_01.jpg","/taxonomy/walta/media/headbanger_caddis_m1.mp4"]
# description: "Notalina are special for the way they move. They thrash their thorax, head and legs back and forth to move through the water. This exhausting movement earns them the name head banger caddis. They always have slender cases. Cases can sometimes be made of spirally arranged\n              bits of vegetation"
-> DONE

=== leptocerids ===
# taxonId: "WB169"
# name: "Leptocerids"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Leptoceridae"},{"taxonomicLevel":"alt","name":"Leptocerids"}]
# commonName: "Leptocerids"
# size: null
# signalScore: 6
# habitat: "Wetlands, lakes, slow flowing sections in rivers. Common and often abundant."
# movement: "Ungainly crawl."
# confusedWith: "Double check you haven't got Triplectides or one of the other distinctive caddises from this group."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/leptocerids_01.jpg"]
# description: ""
-> DONE

=== hydropsychidae ===
# taxonId: "WB159"
# name: "Hydropsychidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Hydropsychidae"}]
# commonName: "Net spinning caddis"
# size: 12
# signalScore: 6
# habitat: "Cool flowing water, riffles. Common."
# movement: "Slow moving, sometimes thrashes in open water. Will undulate the abdomen to aerate their gills."
# confusedWith: "Nothing, very distinctive once you have noticed the 'hairy chest' of gills on the abdomen."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hydropsychidae_01.jpg"]
# description: ""
-> DONE

=== ecnomus ===
# taxonId: "WB153"
# name: "Ecnomus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Ecnomidae"},{"taxonomicLevel":"genus","name":"Ecnomus"}]
# commonName: "Bandit caddis"
# size: 15
# signalScore: 4
# habitat: "Still and flowing water, edges. Common."
# movement: " Fidgets but slow moving."
# confusedWith: "Some hunter caddis have a similar head pattern. They are relatively fast moving and 'quest' with their front legs for prey, while ecnomids are less active, and have all three leg-bearing segments sclerotised (hardened). "
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/ecnomus_01.jpg"]
# description: ""
-> DONE

=== hydrobiosidae ===
# taxonId: "WB158"
# name: "Hydrobiosidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"family","name":"Hydrobiosidae"}]
# commonName: "Hunter caddis"
# size: 20
# signalScore: 8
# habitat: "Cool flowing water, riffles, and forest streams. Common."
# movement: "Fast moving, hunt with front legs in front of their body on the off-chance they might hit prey."
# confusedWith: "see Ecnomidae."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/hydrobiosidae_01.jpg","/taxonomy/walta/media/hydrobiosidae_m1.mp4","/taxonomy/walta/media/hydrobiosidae_m2.mp4"]
# description: ""
-> DONE

=== philopotamidae_polycentropodidae_and_ecnomidae ===
# taxonId: "WB170"
# name: "Philopotamidae, Polycentropodidae and Ecnomidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Trichoptera"},{"taxonomicLevel":"genus","name":"Philopotamidae, Polycentropodidae and Ecnomidae"}]
# commonName: "Ginger nuts"
# size: 18
# signalScore: 7
# habitat: "Cool flowing water, riffles, edges, forest streams. Rare."
# movement: "Slow moving. "
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/philopotamidae_polycentropodidae_and_ecnomidae_01.jpg","/taxonomy/walta/media/philopotamidae_m1.mp4"]
# description: ""
-> DONE

=== lepidoptera ===
# taxonId: "WB24"
# name: "Lepidoptera"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Lepidoptera"}]
# commonName: "caterpillars"
# size: 20
# signalScore: 2
# habitat: "Slow moving or still water in amongst aquatic vegetation."
# movement: "Slow moving."
# confusedWith: "Beetle larvae or uncased caddis larvae, but caterpillars have rows of extra grasping organs along their abdomen."
# taxonomicLevel: "order"
# mediaUrls: ["/taxonomy/walta/media/lepidoptera_01.jpg"]
# description: ""
-> DONE

=== megapodagrionidae ===
# taxonId: "WB131"
# name: "Megapodagrionidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Zygoptera"},{"taxonomicLevel":"family","name":"Megapodagrionidae"}]
# commonName: "Megapodagrionidae"
# size: 26
# signalScore: 5
# habitat: "Occurs in slow flowing waters, at the edges of streams, in bogs and seepages. Uncommon."
# movement: "Slow and deliberate."
# confusedWith: "Nothing, unless it has lost its gills."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/megapodagrionidae_01.jpg"]
# description: ""
-> DONE

=== synlestidae ===
# taxonId: "WB132"
# name: "Synlestidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Zygoptera"},{"taxonomicLevel":"family","name":"Synlestidae"}]
# commonName: "Synlestidae"
# size: 20
# signalScore: 3
# habitat: "At the edge of streams amongst tree roots and vegetation. Rare."
# movement: "Slow and cautious."
# confusedWith: "Nothing, unless it has lost its gills."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/synlestidae_01.jpg"]
# description: ""
-> DONE

=== isostictidae ===
# taxonId: "WB129"
# name: "Isostictidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Zygoptera"},{"taxonomicLevel":"family","name":"Isostictidae"}]
# commonName: "Isostictidae"
# size: 20
# signalScore: 3
# habitat: "At the edge of streams amongst tree roots and vegetation. Rare."
# movement: "Slow and cautious."
# confusedWith: "Will look almost exactly like a synlestid (stripy legs and all), but with longer, obviously divided gills."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/isostictidae_01.jpg","/taxonomy/walta/media/isostictidae_02.jpg"]
# description: ""
-> DONE

=== diphlebiidae ===
# taxonId: "WB128"
# name: "Diphlebiidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Zygoptera"},{"taxonomicLevel":"family","name":"Diphlebiidae"}]
# commonName: "Diphlebiidae"
# size: 30
# signalScore: 2
# habitat: "Wetlands, or slow moving water in rivers."
# movement: "Slow, but may swim with a sideways undulating motion if disturbed."
# confusedWith: "Nothing, unless it has lost its gills."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/diphlebiidae_01.jpg"]
# description: ""
-> DONE

=== lestidae_and_coenagrionidae ===
# taxonId: "WB130"
# name: "Lestidae and Coenagrionidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Zygoptera"},{"taxonomicLevel":"family","name":"Lestidae and Coenagrionidae"}]
# commonName: "Lestidae and Coenagrionidae"
# size: 30
# signalScore: 2
# habitat: "Wetlands, or slow moving water in rivers. Very common and sometimes abundant."
# movement: "Slow, but may swim with a rapid sideways undulating motion if disturbed."
# confusedWith: "Nothing, unless it has lost its gills."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/lestidae_and_coenagrionidae_01.jpg","/taxonomy/walta/media/zygoptera_m1.mp4"]
# description: ""
-> DONE

=== spider_mud_eye ===
# taxonId: "WB126"
# name: "spider mud eye"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Epiproctophora"},{"taxonomicLevel":"alt","name":"spider mud eye"}]
# commonName: "Spider mud eye"
# size: 30
# signalScore: 5
# habitat: "Slow flowing waters, among detritus and silt."
# movement: "Slow and careful, but can use a bum jet if disturbed."
# confusedWith: ""
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/spider_mud_eye_01.jpg","/taxonomy/walta/media/spider_mud_eye_m1.mp4"]
# description: ""
-> DONE

=== gomphidae ===
# taxonId: "WB124"
# name: "Gomphidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Epiproctophora"},{"taxonomicLevel":"family","name":"Gomphidae"}]
# commonName: "Gomphids"
# size: 30
# signalScore: 5
# habitat: "Rivers, among detritus and silt, and sometimes wetlands or lakes."
# movement: "Slow and careful, but can use a bum jet if disturbed."
# confusedWith: "Nothing so long as you get a good look at the antennae. These are obvious even on juveniles."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/gomphidae_01.jpg"]
# description: ""
-> DONE

=== telephlebiidae ===
# taxonId: "WB125"
# name: "Telephlebiidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Epiproctophora"},{"taxonomicLevel":"family","name":"Telephlebiidae"}]
# commonName: "Telephlebs"
# size: 30
# signalScore: 9
# habitat: "Rivers. Common. "
# movement: "Slow and careful, but can use a bum jet if disturbed."
# confusedWith: "Note the 'Humbug' patterned juvenile is similar to Aeshnidae"
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/telephlebiidae_01.jpg"]
# description: ""
-> DONE

=== aeshnidae ===
# taxonId: "WB123"
# name: "Aeshnidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Odonata"},{"taxonomicLevel":"suborder","name":"Epiproctophora"},{"taxonomicLevel":"family","name":"Aeshnidae"}]
# commonName: "Couta mud eye"
# size: 40
# signalScore: 5
# habitat: "Wetlands, slow rivers or lakes. Common."
# movement: "Slow and careful, but can use a bum jet if disturbed."
# confusedWith: "Telephlebiidae."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/aeshnidae_01.jpg","/taxonomy/walta/media/aeshnidae_m1.mp4"]
# description: ""
-> DONE

=== neuroptera ===
# taxonId: "WB23"
# name: "Neuroptera"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Neuroptera"}]
# commonName: "lacewing larvae"
# size: 20
# signalScore: 8
# habitat: "Fast flowing streams."
# movement: "Very fast moving (underwater)or slow moving (semi terrestrial)"
# confusedWith: "Beetle larvae, but lacewings often have a distinct neck and their jaws are longer and straighter."
# taxonomicLevel: "order"
# mediaUrls: ["/taxonomy/walta/media/neurorthridae_01.jpg","/taxonomy/walta/media/osmylidae_01.jpg"]
# description: ""
-> DONE

=== corydalidae ===
# taxonId: "WB22"
# name: "Corydalidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Megaloptera"},{"taxonomicLevel":"family","name":"Corydalidae"}]
# commonName: "toebiters"
# size: 35
# signalScore: 10
# habitat: "Fast flowing stony rivers."
# movement: "Slow deliberate crawl."
# confusedWith: "Gyrinid and Hydrophilid beetle larvae, which are much smaller and are not found in fast flowing rivers."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/corydalidae_01.jpg"]
# description: ""
-> DONE

=== taper_tailed_tiger_larvae ===
# taxonId: "WB40"
# name: "taper-tailed tiger larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"taper-tailed tiger larvae"}]
# commonName: "taper-tailed tigers larvae"
# size: 50
# signalScore: 2
# habitat: "Wetlands / temporary water."
# movement: "Constant, all legs moving."
# confusedWith: "Some two-tailed tigers will have smallish tails, so you might need to check with a hand lens."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/taper-tailed_tiger_larvae_01.jpg"]
# description: ""
-> DONE

=== two_tailed_tiger_larvae ===
# taxonId: "WB41"
# name: "two-tailed tiger larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"two-tailed tiger larvae"}]
# commonName: "two-tailed tigers larvae"
# size: 35
# signalScore: 2
# habitat: "Wetlands / temporary water."
# movement: "Constant, all legs moving."
# confusedWith: "See taper-tailed tigers.Small individuals might key out as swimming water tigers, but swimming water tigers usually have better developed tails."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/two-tailed_tiger_larvae_01.jpg","/taxonomy/walta/media/dytiscidae_larva_m1.mp4"]
# description: ""
-> DONE

=== nosey_tiger_larvae ===
# taxonId: "WB42"
# name: "nosey tiger larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"nosey tiger larvae"}]
# commonName: "nosey tigers larvae"
# size: 12
# signalScore: 2
# habitat: "Wetlands and river edges. Very common."
# movement: "Constant, all legs moving."
# confusedWith: "BEWARE: These animals have a pair of tails, or 2 tails and a siphon, so can potentially end up ID'd as stoneflies or mayflies."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/nosey_tiger_larvae_01.jpg","/taxonomy/walta/media/nosey_tiger_larvae_02.jpg","/taxonomy/walta/media/nosey_tiger_larvae_03.jpg"]
# description: ""
-> DONE

=== swimming_water_tiger_larvae ===
# taxonId: "WB44"
# name: "swimming water tiger larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"swimming water tiger larvae"}]
# commonName: "swimming water tiger larvae"
# size: 12
# signalScore: 2
# habitat: "Wetlands and river edges. Common."
# movement: "Constant, all legs moving."
# confusedWith: "Small individuals from the two-tailed tigers will unavoidably key out as swimming water tigers."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/swimming_water_tiger_larvae_01.jpg"]
# description: ""
-> DONE

=== crawling_water_tiger_larvae ===
# taxonId: "WB43"
# name: "crawling water tiger larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"family","name":"Dytiscidae"},{"taxonomicLevel":"alt","name":"crawling water tiger larvae"}]
# commonName: "crawling water tiger larvae"
# size: 12
# signalScore: 2
# habitat: "Wetlands and temporary waters."
# movement: "Slow."
# confusedWith: "Nothing, all the other dytiscid larvae will be fast moving."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/crawling_water_tiger_larvae_01.jpg"]
# description: ""
-> DONE

=== sclerocyphon ===
# taxonId: "WB64"
# name: "Sclerocyphon"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Psephenidae"},{"taxonomicLevel":"genus","name":"Sclerocyphon"}]
# commonName: "Water penny"
# size: 10
# signalScore: 6
# habitat: "Fast flowing water. "
# movement: "Slow or not at all."
# confusedWith: "Trilobites, but they have been extinct since the Carboniferous (280,000,000 years ago), and are marine."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/sclerocyphon_01.jpg","/taxonomy/walta/media/sclerocyphon_02.jpg"]
# description: ""
-> DONE

=== scirtidae ===
# taxonId: "WB67"
# name: "Scirtidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Scirtidae"}]
# commonName: "Marsh beetle larvae"
# size: 10
# signalScore: 6
# habitat: "Flowing water, wetlands, river edges. Fairly common."
# movement: "Slow."
# confusedWith: "Nothing, the flattened shape and long antennae are good characters."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/scirtidae_01.jpg"]
# description: ""
-> DONE

=== elmidae_larvae ===
# taxonId: "WB47"
# name: "Elmidae larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Elmidae"},{"taxonomicLevel":"family","name":"Elmidae larvae"}]
# commonName: "Riffle beetle larvae"
# size: 6
# signalScore: 7
# habitat: "Cool flowing water. Very common. Often found on wood."
# movement: "Slow or still, very difficult to see, some species are very small and camouflaged.....good luck."
# confusedWith: "Nothing, but often overlooked."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/elmidae_larvae_01.jpg"]
# description: ""
-> DONE

=== byrrocryptus ===
# taxonId: "WB66"
# name: "Byrrocryptus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Ptilodactylidae"},{"taxonomicLevel":"genus","name":"Byrrocryptus"}]
# commonName: "Byrrocryptus"
# size: 20
# signalScore: 10
# habitat: "cool flowing water, river edges. "
# movement: "Slow, often holding onto vegetation, or trapped in surface tension."
# confusedWith: "Nothing. "
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/byrrocryptus_01.jpg"]
# description: ""
-> DONE

=== gyrinidae_larvae ===
# taxonId: "WB50"
# name: "Gyrinidae larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Gyrinidae"},{"taxonomicLevel":"family","name":"Gyrinidae larvae"}]
# commonName: "Whirligig beetle larvae"
# size: 15
# signalScore: 4
# habitat: "Wetlands and river edges. Uncommon. "
# movement: "Fast, mix of swimming with legs and undulating the abdomen."
# confusedWith: "Nothing, feathery projections are distinctive, may need a hand lens to see these."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/gyrinidae_larvae_01.jpg"]
# description: ""
-> DONE

=== berosus ===
# taxonId: "WB55"
# name: "Berosus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hydrophilidae"},{"taxonomicLevel":"genus","name":"Berosus"}]
# commonName: "Tasselled scavenger"
# size: 8
# signalScore: 2
# habitat: "Wetlands, river edges."
# movement: "Slow crawl."
# confusedWith: "Gyrinid larvae, but the lateral filaments on Berosus lack feathering, and Berosus is rarely as slender."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/berosus_01.jpg"]
# description: ""
-> DONE

=== hydrophilus ===
# taxonId: "WB57"
# name: "Hydrophilus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hydrophilidae"},{"taxonomicLevel":"genus","name":"Hydrophilus"}]
# commonName: "Ugly Bob"
# size: 50
# signalScore: 2
# habitat: "Wetlands."
# movement: "Slow crawl or swimming with all legs."
# confusedWith: "Nothing. Nothing else gets this big."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/hydrophilus_01.jpg"]
# description: ""
-> DONE

=== water_scavenger_beetle_larvae ===
# taxonId: "WB59"
# name: "Water scavenger beetle larvae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Coleoptera"},{"taxonomicLevel":"family","name":"Hydrophilidae"},{"taxonomicLevel":"alt","name":"Water scavenger beetle larvae"}]
# commonName: "Water scavenger beetle larvae"
# size: 10
# signalScore: 2
# habitat: "Wetlands and river edges."
# movement: "Slow crawl."
# confusedWith: "Juvenile ugly bobs (Hydrophilus) are difficult to tell apart, but they have darker heads that are angled/kinked up. For water scavenger beetle larvae the head is in line with the rest of the body."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/water_scavenger_beetle_larvae_01.jpg"]
# description: ""
-> DONE

=== eustheniidae ===
# taxonId: "WB137"
# name: "Eustheniidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Eustheniidae"}]
# commonName: "U sthenids"
# size: 40
# signalScore: 10
# habitat: "Upland streams, more often in alpine and sub-alpine areas."
# movement: "Deliberate, may try and crawl out of picking tray."
# confusedWith: "Nothing, robust, and distinctively coloured."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/eustheniidae_01.jpg"]
# description: ""
-> DONE

=== riekoperla ===
# taxonId: "WB140"
# name: "Riekoperla"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Gripopterygidae"},{"taxonomicLevel":"genus","name":"Riekoperla"}]
# commonName: "Spiky reek o perla"
# size: 10
# signalScore: 8
# habitat: "Upland streams."
# movement: ""
# confusedWith: "Other gripops, you will need to look at these animals from the side to make sure you see the projections."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/riekoperla_01.jpg"]
# description: ""
-> DONE

=== hairy_sprawler ===
# taxonId: "WB141"
# name: "Hairy sprawler"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Gripopterygidae"},{"taxonomicLevel":"alt","name":"Hairy sprawler"}]
# commonName: "Hairy sprawler"
# size: 18
# signalScore: 10
# habitat: "Fast flowing rivers and streams."
# movement: "Slow, sometimes flex side to side while unattached."
# confusedWith: "Other gripops can be similar. With a white background you can be more confident that you haven't missed the dark, extremely hairy legs."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/hairy_sprawler_01.jpg"]
# description: ""
-> DONE

=== illiesoperla ===
# taxonId: "WB139"
# name: "Illiesoperla"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Gripopterygidae"},{"taxonomicLevel":"genus","name":"Illiesoperla"}]
# commonName: "Blond sprawler"
# size: 18
# signalScore: 10
# habitat: "Rivers and streams."
# movement: "Slow, sometimes flex side to side while unattached."
# confusedWith: "Hairy sprawlers can appear similar. However, with a white background and a hand lens, you can be more confident that you haven't just missed the hairy legs. Illiesoperla can have hairs on its legs, but never long dark ones, and often has light purple gills. Sometimes beige\n              or brown rather than blond."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/illiesoperla_01.jpg"]
# description: ""
-> DONE

=== gripops_or_fluffy_bums ===
# taxonId: "WB142"
# name: "Gripops or Fluffy bums"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Gripopterygidae"},{"taxonomicLevel":"alt","name":"Gripops or Fluffy bums"}]
# commonName: "Gripops or Fluffy bums"
# size: 10
# signalScore: 7
# habitat: "Rivers and wetlands."
# movement: ""
# confusedWith: "This is a diverse group of leftovers, check carefully for projections and hairy legs before using this name."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/gripops_or_fluffy_bums_01.jpg","/taxonomy/walta/media/gripopterygidae_m1.mp4"]
# description: ""
-> DONE

=== notonemouridae ===
# taxonId: "WB143"
# name: "Notonemouridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Notonemouridae"}]
# commonName: "Noto nemoor ids"
# size: 12
# signalScore: 6
# habitat: "Occurs in small upland streams and in small lowland streams. Sometimes found in wetlands."
# movement: "Fast, 'alert' and strangely dog-like."
# confusedWith: "Gripops that have retracted their gill tufts will key out here. Look closely with a hand lens, also check for tail wagging, a characteristically gripop behaviour."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/notonemouridae_01.jpg"]
# description: "Notice the 'alert' posture. Inset photo shows the abdomen without gills."
-> DONE

=== acruroperla_atra ===
# taxonId: "WB135"
# name: "Acruroperla atra"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Austroperlidae"},{"taxonomicLevel":"species","name":"Acruroperla atra"}]
# commonName: "Acruroperla atra"
# size: 18
# signalScore: 10
# habitat: "Often associated with submerged wood in upland streams."
# movement: "Slow, but deliberate."
# confusedWith: "Nothing, one of the snazziest stonefly nymphs you will see."
# taxonomicLevel: "species"
# mediaUrls: ["/taxonomy/walta/media/acruroperla_atra_01.jpg"]
# description: ""
-> DONE

=== austroperlids ===
# taxonId: "WB136"
# name: "Austroperlids"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Plecoptera"},{"taxonomicLevel":"family","name":"Austroperlidae"},{"taxonomicLevel":"alt","name":"Austroperlids"}]
# commonName: "Austroperlids"
# size: 30
# signalScore: 10
# habitat: "Cool upland forested streams, often amongst bark and leaf litter."
# movement: "Slow moving."
# confusedWith: "Nothing, the short tails and long abdomen are good characters."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/austroperlids_01.jpg"]
# description: ""
-> DONE

=== coloburiscoides ===
# taxonId: "WB92"
# name: "Coloburiscoides"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Coloburiscidae"},{"taxonomicLevel":"genus","name":"Coloburiscoides"}]
# commonName: "stream horses"
# size: 20
# signalScore: 8
# habitat: "Cool upland streams. Common and abundant in healthy boulder streams."
# movement: "Like a rocking-horse."
# confusedWith: "Nothing, very distinctive in robustness and movement. Look for spiky V shaped gills for confirmation."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/coloburiscoides_01.jpg","/taxonomy/walta/media/coloburiscoides_m1.mp4"]
# description: ""
-> DONE

=== mirawara ===
# taxonId: "WB88"
# name: "Mirawara"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Ameletopsidae"},{"taxonomicLevel":"genus","name":"Mirawara"}]
# commonName: "killer mayflies/purple perils"
# size: 20
# signalScore: 7
# habitat: "Fast flowing cool cobbly streams. Rare."
# movement: "Fast and searching for prey. Regularly 'shuffles' gills."
# confusedWith: "Nothing, very distinctive head shape and size."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/mirawara_01.jpg"]
# description: ""
-> DONE

=== jappa ===
# taxonId: "WB95"
# name: "Jappa"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Leptophlebiidae"},{"taxonomicLevel":"genus","name":"Jappa"}]
# commonName: "Jappa"
# size: 20
# signalScore: 8
# habitat: "Slower flowing rivers. Rare."
# movement: "Slow."
# confusedWith: "Nothing else has horns."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/jappa_01.jpg"]
# description: ""
-> DONE

=== atalophlebia ===
# taxonId: "WB94"
# name: "Atalophlebia"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Leptophlebiidae"},{"taxonomicLevel":"genus","name":"Atalophlebia"}]
# commonName: "Atalophlebia"
# size: 22
# signalScore: 5
# habitat: "Slower flowing waters, sometimes wetlands. Very common."
# movement: "Can sometimes 'dolphin' when disturbed, but otherwise walks."
# confusedWith: "Other leptophlebs, but the banded legs and fluffy gills are VERY distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/atalophlebia_01.jpg","/taxonomy/walta/media/atalophlebia_m1.mp4"]
# description: ""
-> DONE

=== leptophlebs ===
# taxonId: "WB96"
# name: "Leptophlebs"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Leptophlebiidae"},{"taxonomicLevel":"alt","name":"Leptophlebs"}]
# commonName: "Leptophlebs"
# size: 20
# signalScore: 8
# habitat: "Cool running water. Very common."
# movement: "Scurry, then stay still. A bit like a huntsman spider, can sometimes 'dolphin' when disturbed."
# confusedWith: "Nothing."
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/leptophlebs_01.jpg","/taxonomy/walta/media/leptophlebiidae_m1.mp4"]
# description: ""
-> DONE

=== siphlonuridae ===
# taxonId: "WB99"
# name: "Siphlonuridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Siphlonuridae"}]
# commonName: "siphlonurids"
# size: 17
# signalScore: 3
# habitat: "Cool, fish free alpine streams and lakes. Very rare. "
# movement: "Walks slowly, infrequent bursts of movement. "
# confusedWith: "Baetids, but baetids are generally smaller, and have long antennae."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/siphlonuridae_01.jpg"]
# description: ""
-> DONE

=== baetidae ===
# taxonId: "WB89"
# name: "Baetidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Baetidae"}]
# commonName: "Baetids"
# size: 10
# signalScore: 5
# habitat: "Still and flowing waters. Common."
# movement: "Bursts of movement like a tiny fish."
# confusedWith: "Siphlonurids."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/baetidae_01.jpg","/taxonomy/walta/media/baetidae_m1.mp4"]
# description: ""
-> DONE

=== caenidae ===
# taxonId: "WB90"
# name: "Caenidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Caenidae"}]
# commonName: "Caenids"
# size: 8
# signalScore: 4
# habitat: "Still and slow moving waters with silty areas. Common. "
# movement: "Slow moving. "
# confusedWith: "Nothing, very distinctive once you have seen the square gill covers."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/caenidae_01.jpg","/taxonomy/walta/media/caenidae_m1.mp4"]
# description: ""
-> DONE

=== tasmanophlebia ===
# taxonId: "WB98"
# name: "Tasmanophlebia"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Ephemeroptera"},{"taxonomicLevel":"family","name":"Oniscigastridae"},{"taxonomicLevel":"genus","name":"Tasmanophlebia"}]
# commonName: "oniscigastrids"
# size: 15
# signalScore: 8
# habitat: "Cool flowing water, edges, backwaters, forest streams. Uncommon."
# movement: "Slow moving. "
# confusedWith: "Nothing, very distinctive patterning."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/tasmanophlebia_01.jpg"]
# description: ""
-> DONE

=== stratiomyidae ===
# taxonId: "WB82"
# name: "Stratiomyidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Stratiomyidae"}]
# commonName: "Soldier fly larvae"
# size: 20
# signalScore: 2
# habitat: "Wetlands, still water, salt lakes. Common."
# movement: "Slow moving almost still but floating."
# confusedWith: "Nothing, very distinctive amount of sclerotisation and usually suspended from surface by its rear end."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/stratiomyidae_01.jpg"]
# description: ""
-> DONE

=== psychodidae ===
# taxonId: "WB80"
# name: "Psychodidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Psychodidae"}]
# commonName: "Moth fly larvae"
# size: 4
# signalScore: 3
# habitat: "Wetlands, still water. Often overlooked."
# movement: "Slow moving. "
# confusedWith: "Nothing, very distinctive once you have found them. Might look stripy like some elmid beetle larvae."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/psychodidae_01.jpg"]
# description: ""
-> DONE

=== dixidae ===
# taxonId: "WB78"
# name: "Dixidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Dixidae"}]
# commonName: "'U' bent midges"
# size: 6
# signalScore: 7
# habitat: "Wetlands, still water, the edges of farm dams. Uncommon."
# movement: "Bend and unbend just under water surface."
# confusedWith: "Nothing, the large plate that punctures the surface (like an air anchor) and the movement are unique."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/dixidae_01.jpg"]
# description: ""
-> DONE

=== culicidae ===
# taxonId: "WB77"
# name: "Culicidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Culicidae"}]
# commonName: "Mosquito larvae, wrigglers"
# size: 9
# signalScore: 1
# habitat: "Wetlands, still water, even buckets left out for too long. Common."
# movement: "Thrashing and tumbling. "
# confusedWith: "Nothing, very distinctive and well known to most people."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/culicidae_01.jpg","/taxonomy/walta/media/culicidae_m1.mp4"]
# description: ""
-> DONE

=== syrphidae ===
# taxonId: "WB83"
# name: "Syrphidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Syrphidae"}]
# commonName: "Rat tailed maggot"
# size: 20
# signalScore: 1
# habitat: "Still, nutrient rich (liquid faeces) waters."
# movement: "Slow moving by stretching."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/syrphidae_01.jpg"]
# description: ""
-> DONE

=== ephydridae_and_sciomyzidae ===
# taxonId: "WB79"
# name: "Ephydridae and Sciomyzidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Ephydridae and Sciomyzidae"}]
# commonName: "Wetland maggots"
# size: 15
# signalScore: 2
# habitat: "Wetlands, still water, Ephydrids in salty lakes. Widespread."
# movement: "Slow moving. "
# confusedWith: "Most things maggoty, the short body and welts are good clues. This group NEVER has tassels."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/ephydridae_and_sciomyzidae_01.jpg"]
# description: ""
-> DONE

=== blephariceridae ===
# taxonId: "WB70"
# name: "Blephariceridae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Blephariceridae"}]
# commonName: "Bleff"
# size: 13
# signalScore: 10
# habitat: "Fast flowing streams with stable boulders, lives in the fastest bits."
# movement: "Strange sideways shuffle."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/blephariceridae_01.jpg"]
# description: ""
-> DONE

=== simuliidae ===
# taxonId: "WB81"
# name: "Simuliidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Simuliidae"}]
# commonName: "Black fly larvae"
# size: 5
# signalScore: 5
# habitat: "Fast flowing waters. Common and abundant."
# movement: "leech-like."
# confusedWith: "Nothing, other than chicken drumsticks. Very distinctive."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/simuliidae_01.jpg","/taxonomy/walta/media/simuliidae_02.jpg","/taxonomy/walta/media/simuliidae_m1.mp4"]
# description: ""
-> DONE

=== Chironomus ===
# taxonId: "WB75"
# name: "Chironomus"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Chironomidae"},{"taxonomicLevel":"genus","name":"Chironomus"}]
# commonName: "Blood worm"
# size: 14
# signalScore: 1
# habitat: "Wetlands, still water. Common."
# movement: ": Coil and uncoil quickly in a figure of eight, sometimes thrashing or using prolegs to drag themselves along the ground."
# confusedWith: "Nothing, very distinctive."
# taxonomicLevel: "genus"
# mediaUrls: ["/taxonomy/walta/media/Chironomus_01.jpg","/taxonomy/walta/media/Chironomus_m1.mp4"]
# description: ""
-> DONE

=== ceratopogonidae ===
# taxonId: "WB71"
# name: "Ceratopogonidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Ceratopogonidae"}]
# commonName: "Pog"
# size: 10
# signalScore: 4
# habitat: "Wetlands, still water, river edges. Common."
# movement: "Like a stiff snake, or a swimming eyelash, very distinctive."
# confusedWith: "Nothing, very distinctive movement, and nothing else has the pointy head."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/ceratopogonidae_01.jpg","/taxonomy/walta/media/ceratopogonidae_m1.mp4"]
# description: ""
-> DONE

=== chironomid ===
# taxonId: "WB76"
# name: "Chironomid"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Chironomidae"},{"taxonomicLevel":"alt","name":"Chironomid"}]
# commonName: "Chironomid"
# size: 13
# signalScore: 3
# habitat: "All habitats. Common."
# movement: ": Coil and uncoil quickly in a figure of eight, sometimes thrashing or using prolegs to drag themselves along the ground."
# confusedWith: "Nothing, very distinctive but quite variable. "
# taxonomicLevel: "alt"
# mediaUrls: ["/taxonomy/walta/media/chironomid_01.jpg"]
# description: ""
-> DONE

=== tipulidae ===
# taxonId: "WB85"
# name: "Tipulidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Tipulidae"}]
# commonName: "Crane fly larvae"
# size: 36
# signalScore: 5
# habitat: "All habitats. Common but not abundant."
# movement: "Slow moving burrowing with twists, or with expansion and contraction."
# confusedWith: "Nothing, very distinctive. Some have distinctive, swollen, rear ends (photo left) and others complicated breathing appendages (photo right)."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/Tipulidae_01.jpg","/taxonomy/walta/media/Tipulidae_02.jpg","/taxonomy/walta/media/Tipulidae_03.jpg"]
# description: ""
-> DONE

=== athericidae ===
# taxonId: "WB69"
# name: "Athericidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Athericidae"}]
# commonName: "Tasselled maggot"
# size: 10
# signalScore: 8
# habitat: "Rivers, gravel and sand."
# movement: "Slow moving"
# confusedWith: "Nothing, very distinctive once you have definitely seen the side projections."
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/athericidae_01.jpg","/taxonomy/walta/media/athericidae_02.jpg"]
# description: ""
-> DONE

=== tabanidae_dolichopodidae_empididae_some_tipulidae ===
# taxonId: "WB84"
# name: "Tabanidae, Dolichopodidae, Empididae & some Tipulidae"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"subphylum","name":"Hexapoda"},{"taxonomicLevel":"class","name":"Insecta"},{"taxonomicLevel":"order","name":"Diptera"},{"taxonomicLevel":"family","name":"Tabanidae, Dolichopodidae, Empididae & some Tipulidae"}]
# commonName: "River maggots"
# size: 30
# signalScore: 4
# habitat: "Rivers, usually amongst gravels. Common."
# movement: "Slow moving. "
# confusedWith: ""
# taxonomicLevel: "family"
# mediaUrls: ["/taxonomy/walta/media/tabanidae_dolichopodidae_empididae_some_tipulidae_01.jpg","/taxonomy/walta/media/tabanidae_dolichopodidae_empididae_some_tipulidae_02.jpg","/taxonomy/walta/media/tabanidae_dolichopodidae_empididae_some_tipulidae_03.jpg"]
# description: ""
-> DONE

=== oligochaeta ===
# taxonId: "WB175"
# name: "Oligochaeta"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"phylum","name":"Annelida"},{"taxonomicLevel":"class","name":"Oligochaeta"}]
# commonName: "Worms"
# size: 10
# signalScore: 1
# habitat: "Rivers, wetlands, in sediment."
# movement: "Like an earthworm. Smaller worms may swim by wriggling."
# confusedWith: "Leeches, but worms have no suckers."
# taxonomicLevel: "class"
# mediaUrls: ["/taxonomy/walta/media/oligochaeta_01.jpg"]
# description: ""
-> DONE

=== hirudinea ===
# taxonId: "WB174"
# name: "Hirudinea"
# scientificName: [{"taxonomicLevel":"phylum","name":"Arthropoda"},{"taxonomicLevel":"phylum","name":"Annelida"},{"taxonomicLevel":"class","name":"Hirudinea"}]
# commonName: "Leeches"
# size: 10
# signalScore: 1
# habitat: "Rivers, wetlands."
# movement: "Characteristic looping motion, elongation and contraction of body."
# confusedWith: "Worms or flatworms, neither of which have suckers."
# taxonomicLevel: "class"
# mediaUrls: ["/taxonomy/walta/media/hirudinea_01.jpg"]
# description: ""
-> DONE

=== turbellaria ===
# taxonId: "WB197"
# name: "Turbellaria"
# scientificName: [{"taxonomicLevel":"phylum","name":"Turbellaria"}]
# commonName: "flatworms"
# size: 20
# signalScore: 1
# habitat: "Rivers, wetlands."
# movement: "Slow glide."
# confusedWith: "Leeches, but flatworms have no suckers and move differently."
# taxonomicLevel: "phylum"
# mediaUrls: ["/taxonomy/walta/media/turbellaria_01.jpg"]
# description: ""
-> DONE

=== nematoda ===
# taxonId: "WB195"
# name: "Nematoda"
# scientificName: [{"taxonomicLevel":"phylum","name":"Nematoda"}]
# commonName: "Roundworms"
# size: 5
# signalScore: 1
# habitat: "Rivers, wetlands, all habitats in sediment."
# movement: "Thrashing, coiling and uncoiling."
# confusedWith: "Gordian worms, which are much larger."
# taxonomicLevel: "phylum"
# mediaUrls: ["/taxonomy/walta/media/nematoda_01.jpg"]
# description: ""
-> DONE

=== nematomorpha ===
# taxonId: "WB196"
# name: "Nematomorpha"
# scientificName: [{"taxonomicLevel":"phylum","name":"Nematomorpha"}]
# commonName: "Gordian worms"
# size: 50
# signalScore: 5
# habitat: "Rivers."
# movement: "Very slow and deliberate coiling and uncoiling."
# confusedWith: "Wire or thread."
# taxonomicLevel: "phylum"
# mediaUrls: ["/taxonomy/walta/media/nematomorpha_01.jpg"]
# description: ""
-> DONE
