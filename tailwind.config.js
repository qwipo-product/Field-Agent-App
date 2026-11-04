/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/app/**/*.{css,xml,html,vue,svelte,ts,tsx}",
      "./src/app/pages/**/*.{css,xml,html,vue,svelte,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#2781E7",      // Blue (Main brand color)
          secondary: "#4F4F4F",    // Dark Gray (Secondary text color)
          accent: "#a54dfe",       // Violet (Accent color)
          danger: "#FF3B30",       // Red (Error or cancel actions)
          success: "#0F7A48",      // Green (Success messages)
          info: "#114A97",         // Deep Blue (Button color)
          searchBg: "#F4F4F4",     // Light Gray (Search field background)
          textDark: "#231f1f",     // Almost black (Primary text color)
          textMuted: "#9A9A9A",    // Light Gray (Label text)
          white: "#FFFFFF",        // White (Common use)
          black: "#000000",
          grey : "#D3D3D3",
        },
        fontSize: {
          xs: ["12px", { lineHeight: "16px" }],
          sm: ["14px", { lineHeight: "18px" }],
          base: ["16px", { lineHeight: "24px" }],
          lg: ["18px", { lineHeight: "26px" }],
          xl: ["20px", { lineHeight: "28px" }],
          "2xl": ["24px", { lineHeight: "32px" }],
          "3xl": ["30px", { lineHeight: "36px" }],
          "4xl": ["36px", { lineHeight: "42px" }],
          "5xl": ["48px", { lineHeight: "56px" }],
        },
        borderRadius: {
          none: "0px",
          sm: "4px",
          DEFAULT: "8px",
          md: "12px",
          lg: "16px",
          xl: "20px",
          "2xl": "24px",
          "3xl": "30px",
          full: "9999px",
        },
        borderWidth: {
          DEFAULT: "1px",
          0: "0px",
          2: "2px",
          4: "4px",
          8: "8px",
        },
        fontFamily: {
          sans: ["Roboto", "sans-serif"],
          serif: ["Roboto", "serif"],
          body: ["Roboto"],
        },
        screens: {
          sm: "640px",   // Small screens (mobile)
          md: "768px",   // Tablets
          lg: "1024px",  // Laptops
          xl: "1280px",  // Large screens
          "2xl": "1536px", // Extra large screens
        },
      },
    } ,
    plugins: [],
    corePlugins: {
      preflight: false, // disables browser-specific resets
    },
  }
