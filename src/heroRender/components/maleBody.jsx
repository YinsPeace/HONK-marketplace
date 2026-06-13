import React from "react";
import styles from '../HeroFigure.module.css';

/* MALE TORSO */

import maleArcherBody from "../assets/images/hero/male/clothes/archer-Body.svg";
import maleArcherBehind from "../assets/images/hero/male/clothes/archer-Behind.svg";
import maleBerserkerBody from "../assets/images/hero/male/clothes/berserker-Body.svg";
import maleBerserkerBehind from "../assets/images/hero/male/clothes/berserker-Behind.svg";
import maleKnightBody from "../assets/images/hero/male/clothes/knight-Body.svg";
import maleKnightBehind from "../assets/images/hero/male/clothes/knight-Behind.svg";
import maleLegionnaireBody from "../assets/images/hero/male/clothes/legionnaire-Body.svg";
import maleLegionnaireBehind from "../assets/images/hero/male/clothes/legionnaire-Behind.svg";
import maleMonkBody from "../assets/images/hero/male/clothes/monk-Body.svg";
import maleMonkBehind from "../assets/images/hero/male/clothes/monk-Behind.svg";
import malePirateBody from "../assets/images/hero/male/clothes/pirate-Body.svg";
import malePirateBehind from "../assets/images/hero/male/clothes/pirate-Behind.svg";
import malePriestBody from "../assets/images/hero/male/clothes/priest-Body.svg";
import malePriestBehind from "../assets/images/hero/male/clothes/priest-Behind.svg";
import maleScholarBody from "../assets/images/hero/male/clothes/scholar-Body.svg";
import maleScholarBehind from "../assets/images/hero/male/clothes/scholar-Behind.svg";
import maleSeerBody from "../assets/images/hero/male/clothes/seer-Body.svg";
import maleSeerBehind from "../assets/images/hero/male/clothes/seer-Behind.svg";
import maleThiefBody from "../assets/images/hero/male/clothes/thief-Body.svg";
import maleThiefBehind from "../assets/images/hero/male/clothes/thief-Behind.svg";
import maleWarriorBody from "../assets/images/hero/male/clothes/warrior-Body.svg";
import maleWarriorBehind from "../assets/images/hero/male/clothes/warrior-Behind.svg";
import maleWizardBody from "../assets/images/hero/male/clothes/wizard-Body.svg";
import maleWizardBehind from "../assets/images/hero/male/clothes/wizard-Behind.svg";

import MaleUndies from "../assets/images/hero/male/undies-male.svg";
import MaleBodyHighlight from "../assets/images/hero/male/Body-highlight.svg";
import MaleBodyShadow from "../assets/images/hero/male/Body-shadow.svg";

/* ADVANCED HEROES */
import malePaladinBody from "../assets/images/hero/male/clothes/advanced/paladin-Body.svg";
import malePaladinBehind from "../assets/images/hero/male/clothes/advanced/paladin-Behind.svg";
import maleDarkKnightBody from "../assets/images/hero/male/clothes/advanced/darkKnight-Body.svg";
import maleDarkKnightBehind from "../assets/images/hero/male/clothes/advanced/darkKnight-Behind.svg";
import maleSummonerBody from "../assets/images/hero/male/clothes/advanced/summoner-Body.svg";
import maleSummonerBehind from "../assets/images/hero/male/clothes/advanced/summoner-Behind.svg";
import maleNinjaBody from "../assets/images/hero/male/clothes/advanced/ninja-Body.svg";
import maleNinjaBehind from "../assets/images/hero/male/clothes/advanced/ninja-Behind.svg";
import maleShapeshifterBody from "../assets/images/hero/male/clothes/advanced/shapeshifter-Body.svg";
import maleShapeshifterBehind from "../assets/images/hero/male/clothes/advanced/shapeshifter-Behind.svg";
import maleBardBody from "../assets/images/hero/male/clothes/advanced/bard-Body.svg";
import maleBardBehind from "../assets/images/hero/male/clothes/advanced/bard-Behind.svg";

/* ELITE HEROES */
import maleDragoonBody from "../assets/images/hero/male/clothes/elite/dragoon-Body.svg";
import maleDragoonBehind from "../assets/images/hero/male/clothes/elite/dragoon-Behind.svg";
import maleSageBody from "../assets/images/hero/male/clothes/elite/sage-Body.svg";
import maleSageBehind from "../assets/images/hero/male/clothes/elite/sage-Behind.svg";
import maleSpellBowBody from "../assets/images/hero/male/clothes/elite/spellbow-Body.svg";
import maleSpellBowBehind from "../assets/images/hero/male/clothes/elite/spellbow-Behind.svg";

/* LEGENDARY HEROES */
import maleDreadKnightBody from "../assets/images/hero/male/clothes/legendary/dreadknight-Body.svg";
import maleDreadKnightBehind from "../assets/images/hero/male/clothes/legendary/dreadknight-Behind.svg";


const getBody = (mainClass) => {
	switch (mainClass) {
		case "archer": {
			return {
				body: maleArcherBody,
				behind: maleArcherBehind,
			};
		}
		case "berserker": {
			return {
				body: maleBerserkerBody,
				behind: maleBerserkerBehind,
			};
		}
		case "knight": {
			return {
				body: maleKnightBody,
				behind: maleKnightBehind,
			};
		}
		case "legionnaire": {
			return {
				body: maleLegionnaireBody,
				behind: maleLegionnaireBehind,
			};
		}
		case "monk": {
			return {
				body: maleMonkBody,
				behind: maleMonkBehind,
			};
		}
		case "pirate": {
			return {
				body: malePirateBody,
				behind: malePirateBehind,
			};
		}
		case "priest": {
			return {
				body: malePriestBody,
				behind: malePriestBehind,
			};
		}
		case "seer": {
			return {
				body: maleSeerBody,
				behind: maleSeerBehind,
			};
		}
		case "thief": {
			return {
				body: maleThiefBody,
				behind: maleThiefBehind,
			};
		}
		case "warrior": {
			return {
				body: maleWarriorBody,
				behind: maleWarriorBehind,
			};
		}
		case "wizard": {
			return {
				body: maleWizardBody,
				behind: maleWizardBehind,
			};
		}
		case "paladin": {
			return {
				body: malePaladinBody,
				behind: malePaladinBehind,
			};
		}
		case "shapeshifter": {
			return {
				body: maleShapeshifterBody,
				behind: maleShapeshifterBehind,
			};
		}
		case "bard": {
			return {
				body: maleBardBody,
				behind: maleBardBehind,
			};
		}
		case "darkKnight": {
			return {
				body: maleDarkKnightBody,
				behind: maleDarkKnightBehind,
			};
		}
		case "scholar": {
			return {
				body: maleScholarBody,
				behind: maleScholarBehind,
			};
		}
		case "summoner": {
			return {
				body: maleSummonerBody,
				behind: maleSummonerBehind,
			};
		}
		case "ninja": {
			return {
				body: maleNinjaBody,
				behind: maleNinjaBehind,
			};
		}
		case "dragoon": {
			return {
				body: maleDragoonBody,
				behind: maleDragoonBehind,
			};
		}
		case "sage": {
			return {
				body: maleSageBody,
				behind: maleSageBehind,
			};
		}
		case "spellBow": {
			return {
				body: maleSpellBowBody,
				behind: maleSpellBowBehind,
			};
		}
		case "dreadKnight": {
			return {
				body: maleDreadKnightBody,
				behind: maleDreadKnightBehind,
			};
		}
		default: {
			return {};
		}
	}
};

const MaleBody = ({ mainClass, stroke }) => {
	const config = getBody(mainClass ?? "");
	return (
		<>
			<div className={`${styles.heroBody} ${styles.bodyPart}`}>
				<img src={MaleUndies} className={styles.heroUndies} alt="" />
				<img src={config.body} className={styles.clothing} alt="" />
				<img src={MaleBodyHighlight} className={styles.highlight} alt="" />
				<img src={MaleBodyShadow} className={styles.shadow} alt="" />

				{/* Body svg in male folder */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 -0.5 30 45"
					shapeRendering="crispEdges"
					className={styles.color}
				>
					<path
						stroke={stroke}
						d="M18 18h1M11 19h9M10 20h11M10 21h11M10 22h11M10 23h11M10 24h11M11 25h9M11 26h9M11 27h9M11 28h9M11 29h9M11 30h9M10 31h10M11 32h8M12 33h6M13 34h3M14 35h1"
					/>
				</svg>
			</div>
			<div className={`${styles.heroBehind} ${styles.bodyPart}`}>
				<img src={config.behind} className={styles.clothing} alt="" />
			</div>
		</>
	);
};

export default MaleBody;
