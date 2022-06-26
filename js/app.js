// Selecciones
const graf = d3.select("#graf");

// Dimensiones
const anchoTotal = +graf.style("width").slice(0, -2);
const altoTotal = (anchoTotal * 9) / 16;
// Margenes
const margins = {
  top: 60,
  right: 20,
  bottom: 75,
  left: 100,
};
const ancho = anchoTotal - margins.left - margins.right;
const alto = altoTotal - margins.top - margins.bottom;

// Elementos gráficos (layers)
const svg = graf
  .append("svg")
  .attr("width", anchoTotal)
  .attr("height", altoTotal)
  .attr("class", "mapa");

const g = svg
  .append("g")
  .attr("transform", `translate(${margins.left}, ${margins.top})`);

//DEFINIENDO ELEMENTO GRÁFICOS DE LA LIBERÍA D3.GEO QUE MOSTRARÁN EL MAPA
var projection = d3
  .geoMercator()
  .center([-100.0, 25.0])
  .scale(1600)
  .translate([ancho / 2, alto / 2]);

var geoPath = d3.geoPath().projection(projection);

// ------- FUNCIÓN ASÍNCRONA QUE DIBUJARÁ EL MAPA DE MÉXICO CON LOS DATOS DENGUE, CHICONGUNYA ------------
const load = async (mapa) => {
  // Carga de DEL JSON que conteniene los datos sobre casos totales, defunciones y coordenadas de dibujo y posicionamiento (x,y)
  geoMexico = await d3.json("mexico.json", d3.autoType);

  //Constante que accede a las características de cada estado.
  const caracteristicas = geoMexico.features;

  //geoArea nos da el area dado un GeoJson
  var tamanioEdoMex = d3.extent(caracteristicas, function (d) {
    return d3.geoArea(d);
  });

  var newFeatureColor = d3.scaleQuantize().domain(tamanioEdoMex);

  //SE UTILIZA LAS GEO COORDENADAS DEL JSON, PARA DIBUJAR LAS FORMAS DE CADA ESTADO.
  // MEDIANTE EL GEOPATH
  const map = g
    .selectAll("path")
    .data(geoMexico.features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("id", (d) => d.id)
    .attr("class", "estados")
    .style("fill", (d) => {
      //SE APLICA UNA SEMAFORIZACIÓN CON BASE A LOS CASOS TOTALES POR DENGUE, CHICONGUNYA MEDIANTE LA LIBRERÍA COLORBREWER.JS
      // TAMBIÉN SE APLICA UN EFECTO DE OPACIDAD A CADA ESTADO DE LA REPÚBLICA MEDIANTE MOUSEOVER U MOUSEOUT
      if (d.casos_totales <= 1000) {
        return "#2dc653";
      } else if (d.casos_totales > 1000 && d.casos_totales <= 10000) {
        return "#ffdc5e";
      }
      if (d.casos_totales > 10000 && d.casos_totales <= 15000) {
        return "#ee964b";
      }
      if (d.casos_totales > 15000) {
        return "#da344d";
      } else {
        return newFeatureColor(d3.geoArea(d));
      }
    })
    .on("mouseover", function (d, i) {
      d3.select(this)
        .transition()
        .duration("50")
        .attr("opacity", ".500")
        .select("#id");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", "1");
    })
    .style("stroke", (d) => d3.rgb(newFeatureColor(d3.geoArea(d))).darker());

  //SE INDICA LA ABREVIATURA DEL ESTADO Y LOS CASOS TOTLES, ESTOS SON LEIDOS DEL JSON DE MÉXICO
  // Y COLOCADOS CON LAS LLAVES Y VALORES DE POSICIONAMIENTO (X,Y)
  g.selectAll("text")
    .data(geoMexico.features)
    .enter()
    .append("text")
    .attr("x", (d) => projection([d.x, d.y])[0])
    .attr("y", (d) => projection([d.x, d.y])[1])
    .style("font-size", "8px")
    .style("font-family", "sans-serif")
    .style("font-weight", "bold")
    .style("fill", "black")
    .text((d) => {
      return d.id + ":" + d.casos_totales;
    });
};

load("margen");
