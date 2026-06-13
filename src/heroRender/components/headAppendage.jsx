import React from "react"; // useState
import styles from '../HeroFigure.module.css';

import base0 from "../assets/images/hero/head-appendage/head-appendage-base0.svg";
import base1 from "../assets/images/hero/head-appendage/head-appendage-base1.svg";
import base2 from "../assets/images/hero/head-appendage/head-appendage-base2.svg";
import base3 from "../assets/images/hero/head-appendage/head-appendage-base3.svg";
import base4 from "../assets/images/hero/head-appendage/head-appendage-base4.svg";
import base5 from "../assets/images/hero/head-appendage/head-appendage-base5.svg";
import base6 from "../assets/images/hero/head-appendage/head-appendage-base6.svg";
import base7 from "../assets/images/hero/head-appendage/head-appendage-base7.svg";
import base8 from "../assets/images/hero/head-appendage/head-appendage-base8.svg";
import base9 from "../assets/images/hero/head-appendage/head-appendage-base9.svg";
import base10 from "../assets/images/hero/head-appendage/head-appendage-base10.svg";
import base11 from "../assets/images/hero/head-appendage/head-appendage-base11.svg";
import base16 from "../assets/images/hero/head-appendage/head-appendage-base16.svg";
import base17 from "../assets/images/hero/head-appendage/head-appendage-base17.svg";
import base18 from "../assets/images/hero/head-appendage/head-appendage-base18.svg";
import base19 from "../assets/images/hero/head-appendage/head-appendage-base19.svg";
import base20 from "../assets/images/hero/head-appendage/head-appendage-base20.svg";
import base21 from "../assets/images/hero/head-appendage/head-appendage-base21.svg";
import base24 from "../assets/images/hero/head-appendage/head-appendage-base24.svg";
import base25 from "../assets/images/hero/head-appendage/head-appendage-base25.svg";
import base26 from "../assets/images/hero/head-appendage/head-appendage-base26.svg";
import base28 from "../assets/images/hero/head-appendage/head-appendage-base28.svg";
import overlay0 from "../assets/images/hero/head-appendage/head-appendage-overlay0.svg";
import overlay1 from "../assets/images/hero/head-appendage/head-appendage-overlay1.svg";
import overlay2 from "../assets/images/hero/head-appendage/head-appendage-overlay2.svg";
import overlay3 from "../assets/images/hero/head-appendage/head-appendage-overlay3.svg";
import overlay4 from "../assets/images/hero/head-appendage/head-appendage-overlay4.svg";
import overlay5 from "../assets/images/hero/head-appendage/head-appendage-overlay5.svg";
import overlay6 from "../assets/images/hero/head-appendage/head-appendage-overlay6.svg";
import overlay7 from "../assets/images/hero/head-appendage/head-appendage-overlay7.svg";
import overlay8 from "../assets/images/hero/head-appendage/head-appendage-overlay8.svg";
import overlay9 from "../assets/images/hero/head-appendage/head-appendage-overlay9.svg";
import overlay10 from "../assets/images/hero/head-appendage/head-appendage-overlay10.svg";
import overlay11 from "../assets/images/hero/head-appendage/head-appendage-overlay11.svg";
import overlay16 from "../assets/images/hero/head-appendage/head-appendage-overlay16.svg";
import overlay17 from "../assets/images/hero/head-appendage/head-appendage-overlay17.svg";
import overlay18 from "../assets/images/hero/head-appendage/head-appendage-overlay18.svg";
import overlay19 from "../assets/images/hero/head-appendage/head-appendage-overlay19.svg";
import overlay20 from "../assets/images/hero/head-appendage/head-appendage-overlay20.svg";
import overlay21 from "../assets/images/hero/head-appendage/head-appendage-overlay21.svg";
import overlay24 from "../assets/images/hero/head-appendage/head-appendage-overlay24.svg";
import overlay25 from "../assets/images/hero/head-appendage/head-appendage-overlay25.svg";
import overlay26 from "../assets/images/hero/head-appendage/head-appendage-overlay26.svg";
import overlay28 from "../assets/images/hero/head-appendage/head-appendage-overlay28.svg";


const getInfo = (mainClass) => {
  switch (mainClass) {
    case 0: {
      return {
        base: base0,
        baseString: "",
        overlay: overlay0,
      };
    }
    case 1: {
      return {
        base: base1,
        baseString: "M18 9h2M28 9h2M18 10h3M27 10h3M18 11h4M26 11h4M18 12h4M26 12h4M18 13h3M27 13h3M19 14h1M28 14h1",
        overlay: overlay1,
      };
    }
    case 2: {
      return {
        base: base2,
        baseString:
          "M15 9h1M31 9h2M14 10h1M17 10h2M26 10h3M32 10h2M14 11h1M16 11h4M25 11h5M32 11h2M14 12h7M24 12h10M15 13h2M18 13h3M24 13h3M29 13h4M19 14h2M25 14h1",
        overlay: overlay2,
      };
    }
    case 3: {
      return {
        base: base3,
        baseString:
          "M17 11h2M27 11h3M16 12h4M26 12h5M16 13h4M25 13h3M29 13h3M16 14h2M19 14h1M25 14h2M30 14h2M16 15h2M30 15h2M16 16h2M29 16h2M17 17h2M28 17h2",
        overlay: overlay3,
      };
    }
    case 4: {
      return {
        base: base4,
        baseString:
          "M19 8h1M26 8h1M19 9h1M26 9h1M19 10h2M25 10h2M19 11h2M25 11h2M19 12h2M25 12h2M19 13h2M25 13h2M20 14h1M25 14h1",
        overlay: overlay4,
      };
    }
    case 5: {
      return {
        base: base5,
        baseString: "M18 9h1M28 9h2M18 10h3M26 10h4M18 11h3M26 11h4M19 12h2M26 12h4M19 13h1M27 13h3",
        overlay: overlay5,
      };
    }
    case 6: {
      return {
        base: base6,
        baseString: "M7 11h1M18 11h1M7 12h2M18 12h3M25 12h2M8 13h3M16 13h6M24 13h4M9 14h18M11 15h7M21 15h4",
        overlay: overlay6,
      };
    }
    case 7: {
      return {
        base: base7,
        baseString: "M20 12h1M25 12h1M20 13h2M24 13h2M20 14h2M24 14h2",
        overlay: overlay7,
      };
    }
    case 8: {
      return {
        base: base8,
        baseString:
          "M21 3h1M25 3h1M20 4h2M25 4h2M20 5h2M25 5h2M19 6h3M25 6h3M18 7h3M25 7h3M18 8h2M26 8h2M18 9h2M26 9h2M18 10h3M25 10h3M19 11h3M24 11h3M20 12h2M24 12h2M20 13h2M24 13h2",
        overlay: overlay8,
      };
    }
    case 9: {
      return {
        base: base9,
        baseString: "M19 11h1M26 11h2M19 12h2M24 12h4M20 13h2M23 13h3M21 14h3M22 15h1",
        overlay: overlay9,
      };
    }
    case 10: {
      return {
        base: base10,
        baseString:
          "M21 1h2M20 2h4M16 3h2M20 3h4M15 4h4M21 4h3M15 5h5M23 5h1M16 6h2M20 6h1M24 6h1M20 7h1M24 7h1M21 8h1M24 8h1M21 9h1M24 9h1M21 10h1M24 10h1",
        overlay: overlay10,
      };
    }
    case 11: {
      return {
        base: base11,
        baseString: "M23 5h2M23 6h2M26 6h2M23 7h5M29 7h2M23 8h8M23 9h7M23 10h6M25 11h3",
        overlay: overlay11,
      };
    }
    case 16: {
      return {
        base: base16,
        baseString:
          "M19 4h1M26 4h1M19 5h1M26 5h1M19 6h1M26 6h1M19 7h2M25 7h2M17 8h1M19 8h2M25 8h2M29 8h1M17 9h1M19 9h2M25 9h2M29 9h1M17 10h4M25 10h2M28 10h2M17 11h4M25 11h2M28 11h2M18 12h3M25 12h4M18 13h3M25 13h4M19 14h2M25 14h1M27 14h1",
        overlay: overlay16,
      };
    }
    case 17: {
      return {
        base: base17,
        baseString: "M17 11h1M30 11h1M16 12h3M29 12h3M17 13h3M26 13h5M18 14h3M25 14h5M19 15h2M25 15h2",
        overlay: overlay17,
      };
    }
    case 18: {
      return {
        base: base18,
        baseString: "M18 12h3M27 12h4M18 13h2M28 13h3M19 14h1M28 14h2M28 15h1",
        overlay: overlay18,
      };
    }
    case 19: {
      return {
        base: base19,
        baseString: "M18 11h1M26 11h1M19 12h1M25 12h1M20 13h1M24 13h1M20 14h1M24 14h1",
        overlay: overlay19,
      };
    }
    case 20: {
      return {
        base: base20,
        baseString:
          "M23 5h1M19 6h1M23 6h1M27 6h1M19 7h2M22 7h3M26 7h2M20 8h7M19 9h9M18 10h2M21 10h2M24 10h2M27 10h2M18 11h5M24 11h5M18 12h1M20 12h1M26 12h1M28 12h1M15 13h4M28 13h4M18 14h1M28 14h1M18 15h1M28 15h1M16 16h2M19 16h1M27 16h1M29 16h2M19 17h1M27 17h1",
        overlay: overlay20,
      };
    }
    case 21: {
      return {
        base: base21,
        baseString: "M13 5h1M13 6h2M14 7h2M14 8h4M15 9h5M16 10h6M17 11h7M19 12h6M20 13h5M21 14h3",
        overlay: overlay21,
      };
    }
    case 24: {
      return {
        base: base24,
        baseString: "M17 14h3M28 14h5M17 15h3M28 15h4M18 16h2M28 16h3M19 17h1M28 17h2",
        overlay: overlay24,
      };
    }
    case 25: {
      return {
        base: base25,
        baseString: "M18 12h1M29 12h1M18 13h2M28 13h2M18 14h2M27 14h3M18 15h2M27 15h3M19 16h1M27 16h2M27 17h1",
        overlay: overlay25,
      };
    }
    case 26: {
      return {
        base: base26,
        baseString:
          "M14 5h5M30 5h5M12 6h8M29 6h8M11 7h7M31 7h7M10 8h8M31 8h8M9 9h10M30 9h10M9 10h2M12 10h8M29 10h8M38 10h2M9 11h1M12 11h2M15 11h2M18 11h3M28 11h3M32 11h2M35 11h2M39 11h1M12 12h1M15 12h1M19 12h2M28 12h2M33 12h1M36 12h1",
        overlay: overlay26,
      };
    }
    case 28: {
      return {
        base: base28,
        baseString: "M22 13h1M21 14h3M22 15h1",
        overlay: overlay28,
      };
    }
    default: {
      return {};
    }
  }
};

const Appendage = ({ overlay, stroke, baseString }) => {
  return (
    <div className={styles.headAppendage}>
      <React.Fragment>
        <img src={overlay} className={styles.overlay} alt="" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -0.5 59 45"
          shapeRendering="crispEdges"
          className={styles.color}
        >
          <path stroke={stroke} d={baseString} />
        </svg>
      </React.Fragment>
    </div>
  );
};

export const HeadAppendage = ({ headId, stroke }) => {
  const info = getInfo(headId ?? "");
  return (
    <>
      <Appendage
        base={info.base}
        baseString={info.baseString}
        overlay={info.overlay}
        stroke={stroke}
      />
    </>
  );
};
