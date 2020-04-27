import * as d3 from 'd3';

const window = document.getElementById('root');
const width = 1000;
const height = 1000;
const DETAIL_MAP = {
    name: 'Location',
    value: 'Amount'
};

// calls pack on constructed heirarchy
const pack = data => d3.pack()
    .size([width - 2, height - 2])
    .padding(1)(d3.hierarchy({children: data})
        .sum(d => d.value));

// generates a random string ID 
const gernateRandomId = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
};
const toggleDetailsCard = () => {
    const card = d3.select('#details-card');
    const display = card.style('display');
    card.style('display', () => display === 'block' ? 'none' : 'block')
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY}px`);
};
const populateCardDetails = (nodeData) => {
    let dataDetails = ''; 
    for(const k of Object.keys(nodeData.data)) {
        const v = nodeData.data[k];
        dataDetails += `<div class="flex flex--row"><div class="details-card__details">${DETAIL_MAP[k]}</div><div>${v}</div></div>`;
    }
    d3.select('#details-card')
        .html(dataDetails);
};
function handleMouseOver(data) {
    // const circle = d3.select(this)
    //     .select('circle');
    // const newRad = circle.attr('r') * 1.4;
    // circle.attr('r', newRad);
    populateCardDetails(data);
    toggleDetailsCard();
}

function handleMouseLeave() {
    // const circle = d3.select(this)
    //     .select('circle');
    // const newRad = circle.attr('r') / 1.4;
    // circle.attr('r', newRad);
    d3.select('#hover-details')
        .html('');
    toggleDetailsCard();
}

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
        .attr('height', height)
        .attr('text-anchor', 'middle');
    
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
            d.leafUid = gernateRandomId();
            return d.leafUid;
        })
        .attr('r', d => d.r)
        .attr('fill-opacity', 0.7)
        .attr('fill', d => color(d.data.name));

    leaf.append('clipPath')
        .attr('id', d => {
            d.clipUid = gernateRandomId();
            return d.clipUid;
        })
        .append('use')
        .attr('xlink:href', d => `#${d.leafUid}`);
        

    // .attr('xlink:href', d => d.leafUid.href);
    
    leaf.append('text')
        .attr('clip-path', d => `url(#${d.clipUid})`)
        .selectAll('tspan')
        .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
        .join('tspan')
        .attr('x', 0)
        .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .text(d => d);
    
    // handle mouseover event
    leaf.on('mouseenter', handleMouseOver);
    leaf.on('mouseleave', handleMouseLeave);

})();
