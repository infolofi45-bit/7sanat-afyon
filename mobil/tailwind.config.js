// index.html içindeki tailwind.config ile aynı olmalı
module.exports = {
  content: ["./www/index.html"],
  theme: { extend: {
    colors: { bg:"#0a0a0a", card:"#0f131a", line:"#282c34", accent:"#282c34", sec:"#24272e", soft:"#1f2228", mut:"#8c8c8c", gold:"#fcc522", gold2:"#fdd452" },
    fontFamily: { display:["Fraunces","serif"], sans:["Inter","sans-serif"] },
  } },
};
