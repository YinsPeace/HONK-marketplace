import React from "react"; // useState
import styles from '../HeroFigure.module.css';

import base0 from "../assets/images/hero/back-appendage/back-appendage-base0.svg";
import base1 from "../assets/images/hero/back-appendage/back-appendage-base1.svg";
import base2 from "../assets/images/hero/back-appendage/back-appendage-base2.svg";
import base3 from "../assets/images/hero/back-appendage/back-appendage-base3.svg";
import base4 from "../assets/images/hero/back-appendage/back-appendage-base4.svg";
import base5 from "../assets/images/hero/back-appendage/back-appendage-base5.svg";
import base6 from "../assets/images/hero/back-appendage/back-appendage-base6.svg";
import base7 from "../assets/images/hero/back-appendage/back-appendage-base7.svg";
import base8 from "../assets/images/hero/back-appendage/back-appendage-base8.svg";
import base9 from "../assets/images/hero/back-appendage/back-appendage-base9.svg";
import base10 from "../assets/images/hero/back-appendage/back-appendage-base10.svg";
import base11 from "../assets/images/hero/back-appendage/back-appendage-base11.svg";
import base16 from "../assets/images/hero/back-appendage/back-appendage-base16.svg";
import base17 from "../assets/images/hero/back-appendage/back-appendage-base17.svg";
import base18 from "../assets/images/hero/back-appendage/back-appendage-base18.svg";
import base19 from "../assets/images/hero/back-appendage/back-appendage-base19.svg";
import base20 from "../assets/images/hero/back-appendage/back-appendage-base20.svg";
import base21 from "../assets/images/hero/back-appendage/back-appendage-base21.svg";
import base24 from "../assets/images/hero/back-appendage/back-appendage-base24.svg";
import base25 from "../assets/images/hero/back-appendage/back-appendage-base25.svg";
import base26 from "../assets/images/hero/back-appendage/back-appendage-base26.svg";
import base28 from "../assets/images/hero/back-appendage/back-appendage-base28.svg";
import overlay0 from "../assets/images/hero/back-appendage/back-appendage-overlay0.svg";
import overlay1 from "../assets/images/hero/back-appendage/back-appendage-overlay1.svg";
import overlay2 from "../assets/images/hero/back-appendage/back-appendage-overlay2.svg";
import overlay3 from "../assets/images/hero/back-appendage/back-appendage-overlay3.svg";
import overlay4 from "../assets/images/hero/back-appendage/back-appendage-overlay4.svg";
import overlay5 from "../assets/images/hero/back-appendage/back-appendage-overlay5.svg";
import overlay6 from "../assets/images/hero/back-appendage/back-appendage-overlay6.svg";
import overlay7 from "../assets/images/hero/back-appendage/back-appendage-overlay7.svg";
import overlay8 from "../assets/images/hero/back-appendage/back-appendage-overlay8.svg";
import overlay9 from "../assets/images/hero/back-appendage/back-appendage-overlay9.svg";
import overlay10 from "../assets/images/hero/back-appendage/back-appendage-overlay10.svg";
import overlay11 from "../assets/images/hero/back-appendage/back-appendage-overlay11.svg";
import overlay16 from "../assets/images/hero/back-appendage/back-appendage-overlay16.svg";
import overlay17 from "../assets/images/hero/back-appendage/back-appendage-overlay17.svg";
import overlay18 from "../assets/images/hero/back-appendage/back-appendage-overlay18.svg";
import overlay19 from "../assets/images/hero/back-appendage/back-appendage-overlay19.svg";
import overlay20 from "../assets/images/hero/back-appendage/back-appendage-overlay20.svg";
import overlay21 from "../assets/images/hero/back-appendage/back-appendage-overlay21.svg";
import overlay24 from "../assets/images/hero/back-appendage/back-appendage-overlay24.svg";
import overlay25 from "../assets/images/hero/back-appendage/back-appendage-overlay25.svg";
import overlay26 from "../assets/images/hero/back-appendage/back-appendage-overlay26.svg";
import overlay28 from "../assets/images/hero/back-appendage/back-appendage-overlay28.svg";

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
        baseString:
          "M36 19h2M35 20h3M35 21h2M35 22h2M35 23h2M35 24h2M35 25h2M35 26h2M35 27h2M26 28h1M34 28h3M27 29h2M34 29h2M29 30h2M33 30h3M31 31h4M32 32h2",
        overlay: overlay1,
      };
    }
    case 2: {
      return {
        base: base2,
        baseString:
          "M28 27h4M26 28h8M25 29h10M25 30h3M31 30h5M25 31h1M33 31h3M33 32h4M34 33h3M34 34h3M35 35h3M35 36h3M35 37h3M36 38h3M36 39h4M41 39h2M37 40h6M38 41h5M39 42h3",
        overlay: overlay2,
      };
    }
    case 3: {
      return {
        base: base3,
        baseString: "M22 30h5M35 30h4M24 31h5M36 31h3M26 32h4M35 32h4M28 33h4M34 33h3M38 33h1M29 34h7M31 35h4",
        overlay: overlay3,
      };
    }
    case 4: {
      return {
        base: base4,
        baseString:
          "M38 19h1M37 20h1M36 21h3M36 22h3M35 23h5M35 24h5M35 25h5M36 26h3M38 27h2M39 28h2M39 29h2M24 30h2M39 30h2M24 31h3M38 31h3M25 32h3M37 32h3M26 33h6M35 33h4M27 34h11M30 35h6",
        overlay: overlay4,
      };
    }
    case 5: {
      return {
        base: base5,
        baseString:
          "M15 16h1M35 16h1M14 17h3M34 17h3M15 18h3M33 18h3M16 19h4M31 19h4M17 20h3M31 20h3M17 21h4M30 21h4M19 22h3M29 22h3M20 23h3M28 23h3M21 24h3M27 24h3M22 25h3M26 25h3M23 26h5M24 27h3M23 28h5M22 29h3M26 29h3M21 30h3M27 30h3M20 31h3M28 31h3M19 32h3M29 32h3M18 33h3M30 33h3M17 34h3M31 34h3",
        overlay: overlay5,
      };
    }
    case 6: {
      return {
        base: base6,
        baseString:
          "M35 10h5M33 11h8M32 12h10M32 13h11M31 14h13M31 15h10M30 16h10M30 17h10M30 18h9M30 19h9M30 20h9M31 21h8M31 22h9M31 23h9M32 24h8M31 25h9M30 26h9M28 27h11M27 28h11M26 29h11M26 30h9M25 31h8",
        overlay: overlay6,
      };
    }
    case 7: {
      return {
        base: base7,
        baseString:
          "M39 11h2M38 12h3M37 13h3M36 14h3M31 15h1M35 15h3M31 16h2M34 16h3M31 17h5M30 18h5M29 19h7M28 20h9M27 21h7M26 22h7M25 23h7M24 24h7M23 25h7M22 26h7M21 27h7M20 28h7M19 29h7M18 30h7M17 31h7M16 32h7M15 33h7M14 34h7M13 35h7M13 36h6M13 37h5M13 38h4",
        overlay: overlay7,
      };
    }
    case 8: {
      return {
        base: base8,
        baseString:
          "M20 7h2M28 7h3M18 8h5M27 8h6M13 9h11M26 9h12M11 10h13M26 10h15M9 11h4M14 11h7M22 11h2M26 11h2M30 11h7M38 11h5M8 12h3M13 12h7M31 12h7M40 12h5M7 13h2M12 13h4M18 13h2M31 13h2M35 13h4M43 13h4M6 14h2M11 14h3M17 14h2M32 14h2M37 14h3M45 14h3M5 15h3M10 15h3M16 15h3M32 15h3M38 15h3M46 15h3M5 16h2M9 16h3M15 16h4M32 16h4M39 16h3M48 16h2M4 17h2M9 17h2M14 17h5M32 17h5M40 17h3M49 17h2M4 18h2M8 18h3M13 18h3M17 18h2M32 18h2M35 18h3M41 18h3M50 18h2M4 19h2M8 19h2M13 19h2M17 19h5M28 19h6M36 19h2M42 19h2M51 19h2M3 20h2M7 20h3M13 20h2M16 20h6M28 20h7M37 20h2M43 20h2M52 20h2M3 21h1M7 21h2M12 21h2M16 21h2M20 21h2M28 21h3M33 21h3M38 21h2M43 21h3M53 21h1M2 22h2M6 22h3M12 22h2M16 22h2M20 22h2M28 22h3M34 22h2M38 22h2M44 22h2M53 22h2M2 23h2M6 23h2M11 23h2M16 23h2M34 23h2M39 23h2M44 23h3M53 23h2M3 24h1M6 24h2M11 24h2M15 24h2M35 24h2M39 24h2M45 24h2M53 24h1M6 25h2M11 25h2M15 25h2M35 25h2M40 25h2M46 25h2M5 26h2M11 26h2M15 26h2M35 26h2M40 26h2M46 26h2M5 27h2M11 27h2M15 27h2M35 27h2M41 27h2M47 27h2M5 28h2M11 28h2M16 28h2M34 28h2M41 28h2M47 28h2M5 29h2M12 29h1M16 29h2M34 29h2M41 29h1M47 29h2M5 30h2M17 30h1M34 30h1M48 30h2M5 31h2M48 31h2M5 32h2M48 32h2M5 33h2M49 33h2M5 34h2M49 34h2M5 35h2M49 35h2M5 36h2M49 36h2M6 37h1M49 37h2M49 38h1",
        overlay: overlay8,
      };
    }
    case 9: {
      return {
        base: base9,
        baseString:
          "M26 28h6M26 29h8M32 30h3M33 31h2M34 32h2M34 33h2M34 34h2M34 35h2M35 36h2M35 37h2M36 38h2M36 39h3M42 39h2M37 40h7M39 41h4",
        overlay: overlay9,
      };
    }
    case 10: {
      return {
        base: base10,
        baseString:
          "M31 13h2M30 14h2M36 14h3M29 15h2M34 15h4M28 16h2M32 16h4M27 17h2M30 17h4M28 18h5M28 19h3M34 19h2M27 20h2M32 20h3M30 21h3M28 22h14M27 23h10M31 25h5M28 26h2M27 27h8M30 28h8M33 29h7",
        overlay: overlay10,
      };
    }
    case 11: {
      return {
        base: base11,
        baseString:
          "M22 14h14M21 15h16M21 16h16M21 17h16M21 18h16M21 19h16M22 20h14M22 21h14M22 22h15M22 23h15M22 24h15M22 25h15M22 26h15M22 27h14M22 28h14M22 29h14M23 30h12",
        overlay: overlay11,
      };
    }
    case 16: {
      return {
        base: base16,
        baseString:
          "M8 4h1M40 4h1M7 5h3M39 5h3M7 6h4M38 6h4M8 7h4M37 7h4M9 8h4M36 8h4M9 9h5M35 9h6M8 10h7M34 10h8M8 11h8M33 11h9M9 12h8M32 12h9M10 13h7M31 13h9M10 14h7M31 14h9M11 15h6M31 15h8M11 16h7M30 16h9M10 17h8M30 17h9M10 18h9M29 18h10M11 19h8M29 19h9M11 20h9M27 20h11M11 21h10M26 21h12M11 22h11M24 22h14M11 23h11M24 23h14M11 24h11M24 24h14M11 25h11M24 25h14M12 26h10M24 26h13M12 27h10M24 27h13M13 28h9M25 28h11M14 29h7M26 29h9M15 30h5M27 30h7M15 31h5M27 31h6M18 32h1M28 32h2",
        overlay: overlay16,
      };
    }
    case 17: {
      return {
        base: base17,
        baseString:
          "M14 7h2M34 7h2M14 8h1M35 8h2M13 9h2M35 9h3M13 10h3M34 10h4M13 11h3M34 11h5M13 12h3M33 12h6M12 13h4M33 13h7M12 14h5M32 14h8M12 15h5M32 15h8M11 16h7M31 16h10M11 17h7M31 17h10M11 18h7M30 18h11M11 19h8M29 19h13M11 20h8M28 20h14M11 21h9M27 21h15M10 22h11M26 22h17M10 23h12M24 23h19M10 24h12M23 24h20M10 25h12M23 25h21M10 26h12M23 26h21M10 27h4M15 27h4M28 27h7M36 27h8M10 28h4M16 28h2M30 28h4M38 28h6M10 29h3M16 29h2M31 29h2M39 29h5M10 30h2M16 30h1M32 30h2M40 30h4M10 31h2M40 31h4M10 32h1M41 32h3M10 33h1M41 33h3M10 34h1M41 34h2M10 35h1M41 35h2M10 36h1M42 36h1",
        overlay: overlay17,
      };
    }
    case 18: {
      return {
        base: base18,
        baseString:
          "M7 16h9M35 16h11M6 17h13M31 17h17M5 18h15M29 18h20M5 19h16M28 19h21M5 20h17M27 20h22M6 21h16M26 21h22M7 22h15M26 22h20M7 23h16M25 23h21M8 24h15M25 24h20M9 25h14M25 25h19M10 26h13M25 26h18M10 27h13M25 27h17M11 28h12M25 28h16M11 29h12M25 29h16M11 30h11M26 30h15M11 31h11M26 31h15M12 32h10M26 32h14M12 33h10M27 33h13M13 34h8M28 34h11M14 35h6M29 35h9M15 36h4M31 36h5",
        overlay: overlay18,
      };
    }
    case 19: {
      return {
        base: base19,
        baseString:
          "M58 2h1M58 3h1M0 4h1M57 4h1M0 5h2M54 5h1M56 5h2M1 6h2M54 6h3M1 7h2M54 7h3M0 8h4M53 8h5M0 9h1M2 9h4M50 9h1M52 9h4M57 9h1M1 10h5M50 10h7M2 11h5M49 11h7M3 12h6M46 12h1M48 12h7M2 13h8M45 13h9M55 13h1M2 14h1M4 14h7M40 14h1M43 14h10M54 14h2M2 15h13M17 15h1M34 15h1M38 15h2M41 15h15M3 16h13M18 16h1M32 16h2M36 16h19M3 17h18M30 17h24M4 18h49M3 19h1M5 19h47M53 19h1M3 20h48M52 20h2M4 21h49M5 22h47M4 23h49M4 24h49M5 25h47M5 26h46M6 27h44M7 28h42M10 29h35M8 30h40M9 31h34M44 31h2M11 32h2M15 32h23M41 32h2M14 33h3M18 33h3M26 33h8M35 33h4M18 34h1M32 34h1",
        overlay: overlay19,
      };
    }
    case 20: {
      return {
        base: base20,
        baseString:
          "M0 5h2M6 5h2M0 6h3M5 6h3M10 6h2M0 7h8M9 7h3M1 8h11M2 9h11M1 10h14M2 11h15M3 12h15M3 13h15M4 14h13M2 15h15M3 16h14M4 17h14M5 18h13M5 19h15M4 20h18M4 21h20M5 22h20M7 23h18M6 24h19M7 25h17M11 26h12M10 27h12M10 28h11M27 28h5M13 29h3M17 29h3M27 29h6M17 30h2M32 30h2M33 31h2M33 32h2M33 33h2M33 34h2M43 34h1M33 35h2M41 35h3M33 36h2M38 36h6M33 37h2M38 37h5M34 38h7M35 39h4",
        overlay: overlay20,
      };
    }
    case 21: {
      return {
        base: base21,
        baseString:
          "M0 12h4M50 12h5M1 13h7M46 13h7M3 14h9M42 14h9M5 15h11M38 15h11M7 16h8M39 16h8M9 17h5M18 17h1M35 17h1M40 17h5M11 18h5M18 18h2M34 18h2M38 18h5M11 19h6M18 19h3M33 19h3M37 19h6M10 20h7M18 20h4M32 20h4M37 20h7M9 21h14M31 21h14M8 22h6M16 22h8M30 22h8M40 22h6M7 23h5M16 23h9M29 23h9M42 23h5M6 24h4M16 24h5M22 24h4M28 24h4M33 24h5M44 24h4M5 25h3M16 25h4M34 25h4M46 25h3M16 26h3M35 26h3M15 27h4M35 27h4M15 28h3M36 28h3M15 29h3M36 29h3M15 30h2M37 30h2M15 31h2M37 31h2M15 32h1M38 32h1M15 33h1M38 33h1",
        overlay: overlay21,
      };
    }
    case 24: {
      return {
        base: base24,
        baseString:
          "M21 9h8M19 10h12M18 11h14M17 12h16M16 13h18M15 14h20M15 15h20M14 16h22M14 17h22M14 18h22M14 19h22M14 20h22M14 21h22M14 22h22M14 23h22M14 24h22M14 25h22M14 26h22M14 27h22M14 28h22M14 29h22M14 30h22M14 31h22M14 32h22M14 33h22M14 34h22M14 35h22M14 36h22M14 37h22M15 38h20M15 39h20M16 40h18M17 41h16M18 42h14M19 43h12M21 44h8",
        overlay: overlay24,
      };
    }
    case 25: {
      return {
        base: base25,
        baseString:
          "M19 3h3M17 4h7M16 5h9M15 6h11M14 7h13M14 8h13M13 9h15M13 10h15M13 11h15M14 12h13M14 13h13M15 14h11M16 15h9M17 16h7M19 17h3M34 17h4M33 18h6M9 19h4M32 19h8M8 20h6M31 20h10M7 21h8M31 21h10M6 22h10M31 22h10M5 23h12M31 23h10M5 24h12M32 24h8M5 25h12M33 25h6M5 26h12M34 26h4M6 27h10M7 28h8M28 28h3M8 29h6M26 29h7M9 30h4M25 30h9M24 31h11M23 32h13M12 33h4M23 33h13M11 34h6M22 34h15M10 35h8M22 35h15M9 36h10M22 36h15M9 37h10M23 37h13M9 38h10M23 38h13M9 39h10M24 39h11M10 40h8M25 40h9M11 41h6M26 41h7M12 42h4M28 42h3",
        overlay: overlay25,
      };
    }
    case 26: {
      return {
        base: base26,
        baseString:
          "M9 0h3M23 0h2M39 0h3M8 1h2M19 1h5M41 1h2M7 2h2M17 2h5M29 2h4M42 2h2M6 3h2M15 3h5M26 3h10M43 3h2M5 4h3M13 4h5M25 4h3M31 4h8M43 4h3M4 5h3M11 5h6M33 5h8M44 5h3M4 6h3M10 6h6M36 6h6M44 6h3M3 7h3M12 7h4M36 7h3M44 7h4M2 8h4M12 8h3M37 8h2M45 8h4M1 9h4M11 9h3M37 9h3M46 9h4M1 10h4M11 10h3M37 10h4M46 10h4M0 11h5M10 11h3M38 11h3M46 11h5M0 12h2M3 12h2M10 12h3M38 12h4M46 12h2M49 12h2M0 13h1M3 13h3M9 13h4M39 13h4M46 13h2M50 13h1M3 14h3M8 14h6M38 14h6M46 14h3M4 15h2M8 15h1M11 15h4M37 15h4M43 15h1M46 15h3M4 16h2M8 16h1M12 16h5M35 16h5M43 16h1M46 16h3M4 17h2M13 17h5M34 17h5M46 17h3M4 18h3M15 18h5M32 18h5M46 18h3M4 19h4M16 19h5M31 19h5M44 19h5M4 20h7M18 20h4M30 20h4M40 20h9M4 21h12M19 21h4M29 21h4M35 21h14M4 22h2M8 22h15M29 22h15M47 22h2M5 23h2M14 23h6M32 23h6M46 23h2M6 24h1M8 24h1M46 24h1M8 25h1M14 25h8M29 25h6M43 25h1M7 26h12M31 26h8M43 26h1M6 27h11M35 27h7M43 27h2M6 28h5M21 28h2M29 28h3M38 28h8M5 29h3M18 29h4M30 29h5M41 29h5M4 30h3M15 30h6M32 30h5M38 30h1M44 30h3M3 31h4M14 31h4M34 31h6M45 31h3M2 32h4M13 32h4M36 32h5M45 32h4M2 33h2M12 33h4M38 33h3M46 33h4M2 34h3M9 34h1M11 34h3M40 34h2M44 34h1M48 34h2M3 35h3M9 35h1M11 35h3M40 35h5M48 35h2M3 36h3M9 36h4M41 36h4M47 36h2M4 37h3M10 37h3M42 37h2M46 37h3M5 38h4M11 38h2M41 38h3M45 38h3M6 39h2M11 39h3M40 39h3M44 39h3M6 40h2M11 40h3M40 40h3M44 40h2M6 41h1M12 41h3M39 41h3M44 41h2M6 42h1M13 42h3M38 42h3M45 42h1M14 43h2M38 43h2M45 43h1M15 44h1M38 44h1",
        overlay: overlay26,
      };
    }
    case 28: {
      return {
        base: base28,
        baseString:
          "M9 2h9M30 2h2M9 3h11M30 3h4M12 4h9M31 4h4M16 5h6M31 5h5M16 6h7M32 6h5M17 7h6M32 7h5M18 8h5M32 8h6M45 8h1M9 9h2M18 9h6M32 9h6M44 9h3M7 10h2M18 10h6M31 10h7M44 10h4M6 11h2M19 11h5M31 11h7M44 11h5M5 12h2M19 12h5M30 12h7M45 12h5M4 13h3M19 13h6M29 13h7M45 13h5M4 14h3M19 14h6M26 14h9M45 14h5M4 15h3M20 15h14M45 15h5M4 16h3M21 16h11M45 16h5M4 17h3M21 17h12M44 17h6M4 18h4M14 18h6M22 18h12M43 18h6M4 19h5M13 19h8M22 19h14M41 19h8M5 20h5M12 20h37M5 21h43M6 22h41M7 23h39M8 24h11M20 24h11M35 24h10M1 25h1M10 25h5M21 25h8M39 25h5M0 26h3M21 26h12M0 27h3M21 27h13M0 28h4M15 28h5M21 28h14M0 29h5M14 29h22M44 29h1M0 30h7M13 30h23M43 30h3M1 31h7M11 31h25M43 31h4M2 32h35M43 32h4M3 33h35M43 33h4M4 34h13M19 34h11M31 34h8M42 34h5M5 35h10M18 35h13M32 35h14M6 36h7M17 36h15M33 36h13M7 37h5M16 37h6M26 37h7M34 37h11M15 38h6M27 38h7M35 38h9M13 39h7M28 39h7M36 39h7M44 39h2M5 40h14M29 40h7M38 40h4M43 40h3M6 41h12M30 41h16M8 42h8M31 42h14M10 43h4M33 43h11M34 44h9",
        overlay: overlay28,
      };
    }
    default: {
      return {};
    }
  }
};

const Appendage = ({ overlay, stroke, baseString, backId }) => {
  return (
    <React.Fragment>
      <img src={overlay} className={styles.overlay} alt="" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -0.5 59 45"
        shapeRendering="crispEdges"
        className={styles.color}
      >
        <path stroke={stroke} d={baseString} />
        {backId === 11 && <path stroke={stroke} d="M16 31h1M32 31h1" />}
      </svg>
    </React.Fragment>
  );
};

export const BackAppendage = ({ backId, stroke }) => {
  const info = getInfo(backId ?? "");
  return (
    <>
      <div className={styles.backAppendage}>
        <Appendage
          backId={backId}
          base={info.base}
          baseString={info.baseString}
          overlay={info.overlay}
          stroke={stroke}
        />
      </div>
    </>
  );
};
