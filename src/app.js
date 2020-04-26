import * as d3 from 'd3';

const window = document.getElementById('root');
const width = 1000;
const height = 1000;
console.log(height);
// calls pack on constructed heirarchy
const pack = data => d3.pack()
    .size([width - 2, height - 2])
    .padding(1)(d3.hierarchy({children: data})
        .sum(d => d.value));


(async function () {
    // Selecting and appending elements
    d3.select('#root')
        .append('h5')
        .append('text')
        .text(`D3 version: ${d3.version}`);

    const svg = d3
        .select('#root')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    // svg.append('line')
    //     .attr('x1', 100)
    //     .attr('y1', 100)
    //     .attr('x2', 200) 
    //     .attr('y2', 200)
    //     .style('stroke', 'rgb(255,0,0)')
    //     .style('stroke-width', 2);    

    
    // Loading external data
    const dataset = await d3.csv('/data/fbi_crime_2016.csv');
    // dataset.forEach(d => console.log(d))

    const filteredData = [];

    // only use burglary data from csv
    dataset.forEach(d => {
        const areaTrim = d.Area.trim();
        if (areaTrim.length) {
            filteredData.push({
                name: areaTrim,
                value: parseInt(d.Burglary.trim().replace(',', ''))
            });
        }
    });

    const color = d3.scaleOrdinal(filteredData.map(d => d.name), d3.schemeCategory10);

    const root = pack(filteredData);
    console.log(root);
    const leaf = svg.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => `translate(${d.x + 1},${d.y + 1})`);

    leaf.append('circle')
        .attr('id', d => {
            // console.log(d);
            return d.data.name;
        })
        .attr('r', d => d.r)
        .attr('fill-opacity', 0.7)
        .attr('fill', d => color(d.data.name));

    leaf.append('clipPath');
    // .append('use')
    // .attr('xlink:href', d => d.leafUid.href);
    
    leaf.append('text')
        .selectAll('tspan')
        .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
        .join('tspan')
        .attr('x', 0)
        .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .text(d => d);
    
    
})();
