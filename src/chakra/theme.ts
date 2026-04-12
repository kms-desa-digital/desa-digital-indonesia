import "@fontsource/inter/300.css"
import "@fontsource/inter/400.css"
import "@fontsource/inter/700.css"
import { extendTheme } from "@chakra-ui/react";
import { Button } from "./button";

export const theme = extendTheme({
  colors: {
    brand: {
      100: "#347357",
      110: "#2B6049",
      120: "#568A73",
      200: "#EAB308",
      300: "#E5E7EB",
      400: "#374151",
    },
  },
  fonts: {
    body: "Inter, sans-serif",
    heading: "Inter, sans-serif",
  },
  styles: {
    global: () => ({
      body: {
        bg: "brand.300",
      },
    }),
  },
  components: {
    Button,
    Modal: {
      baseStyle: {
        dialog: {
          maxWidth: "360px",
          width: "90%",
          mx: "auto",
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          maxWidth: "360px",
          width: "100%",
          mx: "auto",
          left: "0 !important",
          right: "0 !important",
        },
      },
    },
  }
});
