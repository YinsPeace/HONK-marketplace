import React from "react";
import styles from '../HeroFigure.module.css';

/* FEMALE TORSO */

import femaleArcherBody from "../assets/images/hero/female/clothes/archer-Body.svg";
import femaleArcherBehind from "../assets/images/hero/female/clothes/archer-Behind.svg";
import femaleBerserkerBody from "../assets/images/hero/female/clothes/berserker-Body.svg";
import femaleBerserkerBehind from "../assets/images/hero/female/clothes/berserker-Behind.svg";
import femaleKnightBody from "../assets/images/hero/female/clothes/knight-Body.svg";
import femaleKnightBehind from "../assets/images/hero/female/clothes/knight-Behind.svg";
import femaleLegionnaireBody from "../assets/images/hero/female/clothes/legionnaire-Body.svg";
import femaleLegionnaireBehind from "../assets/images/hero/female/clothes/legionnaire-Behind.svg";
import femaleMonkBody from "../assets/images/hero/female/clothes/monk-Body.svg";
import femaleMonkBehind from "../assets/images/hero/female/clothes/monk-Behind.svg";
import femalePirateBody from "../assets/images/hero/female/clothes/pirate-Body.svg";
import femalePirateBehind from "../assets/images/hero/female/clothes/pirate-Behind.svg";
import femalePriestBody from "../assets/images/hero/female/clothes/priest-Body.svg";
import femalePriestBehind from "../assets/images/hero/female/clothes/priest-Behind.svg";
import femaleScholarBody from "../assets/images/hero/female/clothes/scholar-Body.svg";
import femaleScholarBehind from "../assets/images/hero/female/clothes/scholar-Behind.svg";
import femaleSeerBody from "../assets/images/hero/female/clothes/seer-Body.svg";
import femaleSeerBehind from "../assets/images/hero/female/clothes/seer-Behind.svg";
import femaleThiefBody from "../assets/images/hero/female/clothes/thief-Body.svg";
import femaleThiefBehind from "../assets/images/hero/female/clothes/thief-Behind.svg";
import femaleWarriorBody from "../assets/images/hero/female/clothes/warrior-Body.svg";
import femaleWarriorBehind from "../assets/images/hero/female/clothes/warrior-Behind.svg";
import femaleWizardBody from "../assets/images/hero/female/clothes/wizard-Body.svg";
import femaleWizardBehind from "../assets/images/hero/female/clothes/wizard-Behind.svg";

import FemaleUndies from "../assets/images/hero/female/undies-female.svg";
import FemaleBodyHighlight from "../assets/images/hero/female/Body-highlight.svg";
import FemaleBodyShadow from "../assets/images/hero/female/Body-shadow.svg";

/* ADVANCED HEROES */
import femaleBardBody from "../assets/images/hero/female/clothes/advanced/bard-Body.svg";
import femaleBardBehind from "../assets/images/hero/female/clothes/advanced/bard-Behind.svg";
import femalePaladinBody from "../assets/images/hero/female/clothes/advanced/paladin-Body.svg";
import femalePaladinBehind from "../assets/images/hero/female/clothes/advanced/paladin-Behind.svg";
import femaleDarkKnightBody from "../assets/images/hero/female/clothes/advanced/darkKnight-Body.svg";
import femaleDarkKnightBehind from "../assets/images/hero/female/clothes/advanced/darkKnight-Behind.svg";
import femaleShapeshifterBody from "../assets/images/hero/female/clothes/advanced/shapeshifter-Body.svg";
import femaleShapeshifterBehind from "../assets/images/hero/female/clothes/advanced/shapeshifter-Behind.svg";
import femaleSummonerBody from "../assets/images/hero/female/clothes/advanced/summoner-Body.svg";
import femaleSummonerBehind from "../assets/images/hero/female/clothes/advanced/summoner-Behind.svg";
import femaleNinjaBody from "../assets/images/hero/female/clothes/advanced/ninja-Body.svg";
import femaleNinjaBehind from "../assets/images/hero/female/clothes/advanced/ninja-Behind.svg";

/* ELITE HEROES */
import femaleDragoonBody from "../assets/images/hero/female/clothes/elite/dragoon-Body.svg";
import femaleDragoonBehind from "../assets/images/hero/female/clothes/elite/dragoon-Behind.svg";
import femaleSageBody from "../assets/images/hero/female/clothes/elite/sage-Body.svg";
import femaleSageBehind from "../assets/images/hero/female/clothes/elite/sage-Behind.svg";
import femaleSpellBowBody from "../assets/images/hero/female/clothes/elite/spellbow-Body.svg";
import femaleSpellBowBehind from "../assets/images/hero/female/clothes/elite/spellbow-Behind.svg";

/* LEGENDARY HEROES */
import femaleDreadKnightBody from "../assets/images/hero/female/clothes/legendary/dreadknight-Body.svg";
import femaleDreadKnightBehind from "../assets/images/hero/female/clothes/legendary/dreadknight-Behind.svg";


const getBody = (mainClass) => {
	switch (mainClass) {
		case "archer": {
			return {
				body: femaleArcherBody,
				behind: femaleArcherBehind,
			};
		}
		case "berserker": {
			return {
				body: femaleBerserkerBody,
				behind: femaleBerserkerBehind,
			};
		}
		case "knight": {
			return {
				body: femaleKnightBody,
				behind: femaleKnightBehind,
			};
		}
		case "legionnaire": {
			return {
				body: femaleLegionnaireBody,
				behind: femaleLegionnaireBehind,
			};
		}
		case "monk": {
			return {
				body: femaleMonkBody,
				behind: femaleMonkBehind,
			};
		}
		case "pirate": {
			return {
				body: femalePirateBody,
				behind: femalePirateBehind,
			};
		}
		case "priest": {
			return {
				body: femalePriestBody,
				behind: femalePriestBehind,
			};
		}
		case "scholar": {
			return {
				body: femaleScholarBody,
				behind: femaleScholarBehind,
			};
		}
		case "seer": {
			return {
				body: femaleSeerBody,
				behind: femaleSeerBehind,
			};
		}
		case "thief": {
			return {
				body: femaleThiefBody,
				behind: femaleThiefBehind,
			};
		}
		case "warrior": {
			return {
				body: femaleWarriorBody,
				behind: femaleWarriorBehind,
			};
		}
		case "wizard": {
			return {
				body: femaleWizardBody,
				behind: femaleWizardBehind,
			};
		}
		case "paladin": {
			return {
				body: femalePaladinBody,
				behind: femalePaladinBehind,
			};
		}
		case "shapeshifter": {
			return {
				body: femaleShapeshifterBody,
				behind: femaleShapeshifterBehind,
			};
		}
		case "bard": {
			return {
				body: femaleBardBody,
				behind: femaleBardBehind,
			};
		}
		case "darkKnight": {
			return {
				body: femaleDarkKnightBody,
				behind: femaleDarkKnightBehind,
			};
		}
		case "summoner": {
			return {
				body: femaleSummonerBody,
				behind: femaleSummonerBehind,
			};
		}
		case "ninja": {
			return {
				body: femaleNinjaBody,
				behind: femaleNinjaBehind,
			};
		}
		case "dragoon": {
			return {
				body: femaleDragoonBody,
				behind: femaleDragoonBehind,
			};
		}
		case "sage": {
			return {
				body: femaleSageBody,
				behind: femaleSageBehind,
			};
		}
		case "spellBow": {
			return {
				body: femaleSpellBowBody,
				behind: femaleSpellBowBehind,
			};
		}
		case "dreadKnight": {
			return {
				body: femaleDreadKnightBody,
				behind: femaleDreadKnightBehind,
			};
		}
		default: {
			return {};
		}
	}
};

const FemaleBody = ({ mainClass, stroke }) => {
	const config = getBody(mainClass ?? "");
	return (
		<>
			<div className={`${styles.heroBody} ${styles.bodyPart}`}>
				<img src={FemaleUndies} className={styles.heroUndies} alt="" />
				<img src={config.body} className={styles.clothing} alt="" />
				<img src={FemaleBodyHighlight} className={styles.highlight} alt="" />
				<img src={FemaleBodyShadow} className={styles.shadow} alt="" />

				{/* Body svg in female folder */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 -0.5 30 45"
					shapeRendering="crispEdges"
					className={styles.color}
				>
					<path
						stroke={stroke}
						d="M13 20h5M13 21h6M12 22h8M11 23h9M11 24h9M11 25h8M11 26h7M11 27h6M11 28h6M11 29h5"
					/>
				</svg>
			</div>
			<div className={`${styles.heroBehind} ${styles.bodyPart}`}>
				<img src={config.behind} className={styles.clothing} alt="" />
			</div>
		</>
	);
};

export default FemaleBody;
