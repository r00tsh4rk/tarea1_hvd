// ------- FUNCIÓN ASÍNCRONA QUE DIBUJA EL MAPA DE MÉXICO CON LOS DATOS DENGUE ------------
const cargarMapa = async (el) => {
  const mapa = d3.select(el);
  // DIMENSIONES GENERALES DEL GRÁFICO QUE INCORPORA EL MAPA DE MÉXICO
  // Dimensiones
  const anchoTotal = +mapa.style("width").slice(0, -2);
  const altoTotal = (anchoTotal * 9) / 16;

  // LAYER PARA DIBUJAR MAPA DE MÉXICO
  const svg = mapa
    .append("svg")
    .attr("width", anchoTotal)
    .attr("height", altoTotal)
    .attr("class", "mapa");

  // Margenes
  const margins = {
    top: 60,
    right: 20,
    bottom: 75,
    left: 100,
  };
  const ancho = anchoTotal - margins.left - margins.right;
  const alto = altoTotal - margins.top - margins.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${margins.left}, ${margins.top})`);

  //DEFINIENDO ELEMENTO GRÁFICO DE LA LIBERÍA D3.GEO QUE MOSTRARÁN EL MAPA
  var projection = d3
    .geoMercator()
    .center([-100.0, 25.0])
    .scale(1900)
    .translate([ancho / 2, alto / 2]);
  var geoPath = d3.geoPath().projection(projection);
  // Carga de DEL JSON que conteniene los datos sobre casos totales, defunciones y coordenadas de dibujo y posicionamiento (x,y)
  geoMexico = await d3.json("data/geomexico.json", d3.autoType);

  //Constante que accede a las características de cada estado.
  const caracteristicas = geoMexico.features;

  //geoArea nos da el area dado un GeoJson
  var tamanioEdoMex = d3.extent(caracteristicas, function (d) {
    return d3.geoArea(d);
  });

  var newFeatureColor = d3.scaleQuantize().domain(tamanioEdoMex);

  //SE UTILIZA LAS GEO COORDENADAS DEL JSON, PARA DIBUJAR LAS FORMAS DE CADA ESTADO.
  // MEDIANTE EL GEOPATH
  g.selectAll("path")
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

// ------- FUNCIÓN ASÍNCRONA QUE DIBUJA LA GRÁFICA DE BARRAS ------------
const cargarBarras = async (el, variable = "HOMBRE2020") => {
  // Selecciones
  const barras = d3.select(el);
  const metrica = d3.select("#metrica");

  // Dimensiones
  const anchoTotal = +barras.style("width").slice(0, -2);
  const altoTotal = (anchoTotal * 9) / 16;

  const margins = {
    top: 60,
    right: 20,
    bottom: 75,
    left: 100,
  };
  const ancho = anchoTotal - margins.left - margins.right;
  const alto = altoTotal - margins.top - margins.bottom;

  // Elementos gráficos (layers)
  const svg = barras
    .append("svg")
    .attr("width", anchoTotal)
    .attr("height", altoTotal)
    .attr("class", "barras");

  const layer = svg
    .append("g")
    .attr("transform", `translate(${margins.left}, ${margins.top})`);

  layer
    .append("rect")
    .attr("height", alto)
    .attr("width", ancho)
    .attr("fill", "white");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margins.left}, ${margins.top})`);

  // Carga de Datos
  data = await d3.csv("data/edos_promMHEdad.csv", d3.autoType);

  metrica
    .selectAll("option")
    .data(Object.keys(data[0]).slice(1))
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);

  // Accessor
  const xAccessor = (d) => d.Entidad;

  // Escaladores
  const y = d3.scaleLinear().range([alto, 0]);
  const color = d3
    .scaleOrdinal()
    .domain(Object.keys(data[0]).slice(1))
    .range(d3.schemeTableau10);

  const x = d3
    .scaleBand()
    .range([0, ancho])
    .paddingOuter(0.2)
    .paddingInner(0.1);

  const titulo = g
    .append("text")
    .attr("x", ancho / 2)
    .attr("y", -15)
    .classed("titulo", true);

  const etiquetas = g.append("g");

  const xAxisGroup = g
    .append("g")
    .attr("transform", `translate(0, ${alto})`)
    //.attr("transform", "rotate(-90)")
    .classed("axis", true);
  const yAxisGroup = g.append("g").classed("axis", true);

  const render = (variable) => {
    // Accesores
    const yAccessor = (d) => d[variable];
    data.sort((a, b) => yAccessor(b) - yAccessor(a));

    // Escaladores
    y.domain([0, d3.max(data, yAccessor)]);
    x.domain(d3.map(data, xAccessor));

    // Rectángulos (Elementos)
    const rect = g.selectAll("rect").data(data, xAccessor);
    rect
      .enter()
      .append("rect")
      .attr("x", (d) => x(xAccessor(d)))
      .attr("y", (d) => y(0))
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "green")
      .merge(rect)
      .transition()
      .duration(2500)
      // .ease(d3.easeBounce)
      .attr("x", (d) => x(xAccessor(d)))
      .attr("y", (d) => y(yAccessor(d)))
      .attr("width", x.bandwidth())
      .attr("height", (d) => alto - y(yAccessor(d)))
      .attr("fill", (d) =>
        xAccessor(d) == "Satélite" ? "#f00" : color(variable)
      );

    const et = etiquetas.selectAll("text").data(data);
    et.enter()
      .append("text")
      .attr("x", (d) => x(xAccessor(d)) + x.bandwidth() / 2)
      .attr("y", (d) => y(0))
      .merge(et)
      .transition()
      .duration(2500)
      .attr("x", (d) => x(xAccessor(d)) + x.bandwidth() / 2)
      .attr("y", (d) => y(yAccessor(d)))
      .text(yAccessor);

    // Títulos
    titulo.text(`Casos de Dengue en Mexico ${variable} `);

    // Ejes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(8);
    xAxisGroup.transition().duration(2500).call(xAxis);
    yAxisGroup.transition().duration(2500).call(yAxis);
  };

  // Eventos
  metrica.on("change", (e) => {
    e.preventDefault();
    // console.log(e.target.value, metrica.node().value)
    render(e.target.value);
  });
  render(variable);
};

// ------- FUNCIÓN ASÍNCRONA QUE DIBUJA EL MAPA DE CALOR ------------
const cargarMapaCalor = async (el, col, escala = "linear") => {
  // Selección
  const heatmap = d3.select(el);

  // Dimensiones
  const ancho = +heatmap.style("width").slice(0, -2);
  const box = (ancho - 5) / col; //columnas para ocupar todo el espacio
  const alto = box * (650 / col) + 5; //renglones para ocupar todo el espacio

  // Area para dibujo
  const svg = heatmap
    .append("svg")
    .attr("class", "heatmap")
    .attr("width", ancho)
    .attr("height", alto);

  // Carga de datos
  const dataset = await d3.csv("data/edad_anios.csv", d3.autoType);
  console.log(dataset);
  dataset.sort((a, b) => a.edad - b.edad);

  // Escalador
  let color; //es una variable para switch
  switch (escala) {
    case "linear":
      color = d3
        .scaleLinear()
        .domain(d3.extent(dataset, (d) => d.edad)) //dominio los datos X´s
        .range(["#ddddff", "#1111ff"]); //rango colores de valor maximo y minimo
      break;
    case "quantize":
      color = d3
        .scaleQuantize()
        .domain(d3.extent(dataset, (d) => d.edad))
        .range(["#D6234A", "#58C3BB", "grey"]); //#2D7ACO,#F8E469,#D6234A
      break;
    case "threshold":
      color = d3
        .scaleThreshold()
        .domain([31, 41, 51, 61]) //dominio es diferente , aqui se pasan 2 umbrales
        .range(["green", "yellow", "red", "orange", "grey"]);
      break;
  }

  // Dibujo de cuadros
  svg
    .append("g")
    .attr("transform", "translate(5, 5)")
    .selectAll("rect")
    .data(dataset)
    .join("rect")
    .attr("x", (d, i) => box * (i % col))
    .attr("y", (d, i) => box * Math.floor(i / col))
    .attr("width", box - 5)
    .attr("height", box - 5)
    .attr("fill", (d) => color(d.edad))
    .attr("stroke", "#777777");

  svg
    .append("g")
    .attr("transform", "translate(3,3)")
    .selectAll("text")
    .data(dataset)
    .join("text")
    .attr("x", (d, i) => box * (i % col) + box / 2)
    .attr("y", (d, i) => box * Math.floor(i / col) + box / 2)
    .text((d) => d.edad)
    .style("font-size", "8px")
    .style("font-family", "sans-serif")
    .style("font-weight", "bold")
    .style("fill", "black");
};

cargarMapa("#mapa");
cargarBarras("#barras");
cargarMapaCalor("#heatmap", 55, "quantize");
