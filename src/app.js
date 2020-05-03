import * as d3 from 'd3';

const window = document.getElementById('root');
const width = 1000;
const height = 1000;
const DETAIL_MAP = {
    name: 'Location',
    value: 'Amount'
};
let dataset;
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
        if(k.search('_') === -1){
            const v = nodeData.data[k];
            dataDetails += `<div class="flex flex--row"><div class="details-card__details">${DETAIL_MAP[k]}</div><div>${v}</div></div>`;
        }
    }
    d3.select('#details-card')
        .html(dataDetails);
};
function handleMouseOver(data) {
    populateCardDetails(data);
    toggleDetailsCard();
}

function handleMouseLeave() {
    d3.select('#hover-details')
        .html('');
    toggleDetailsCard();
}
function removeNode(node) {
    const index = dataset.findIndex(d => d.Area.trim() === node.data.name);

    dataset.splice(index, 1);
    update();
}
const color = data => d3.scaleOrdinal(data.map(d => d.name), d3.schemeCategory10);

const selection = d3.select('#crimes')
    .on('change', () => {
        d3.transition()
            .duration(7500)
            .each(update);
    });

const svg = d3
    .select('#root')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('text-anchor', 'middle');

(async function () {
    // Selecting and appending elements
    d3.select('#root')
        .append('h5')
        .append('text')
        .text(`D3 version: ${d3.version}`);

    // Loading external data
    const response = await d3.csv('/data/fbi_crime_2016.csv');
    dataset = response.filter(d => d.Area.trim());
    update();
})();

function update() {
    const userSelect = selection.property('value');
    const filteredData = [];
    dataset.forEach(d => {
        const areaTrim = d.Area.trim();
        filteredData.push({
            name: areaTrim,
            value: parseInt(d[userSelect].trim().replace(',', '')),
            _data: d
        });
    });
    const t = d3.transition()
        .duration(750);

    const root = pack(filteredData);
    svg.selectAll('g')
        .data(root.leaves(), function(d) { 
            return d ? d.data.name : this.id; 
        })
        .join(enter => {
            const node = enter.append('g')
                .attr('transform', d => `translate(${d.x + 1},${d.y + 1})`);
            node.on('mouseenter', handleMouseOver);
            node.on('mouseleave', handleMouseLeave);
            node.on('click', removeNode);
            node.append('circle')
                .transition(t)
                .attr('id', d => {
                    if(!d.id) {
                        d.leafUid = gernateRandomId();
                        return d.leafUid;
                    }
                })
                .attr('r', d => d.r)
                .attr('fill-opacity', 0.7)
                .attr('fill', d => color(filteredData)(d.data.name));
            node.append('clipPath')
                .attr('id', d => {
                    d.clipUid = gernateRandomId();
                    return d.clipUid;
                })
                .append('use')
                .attr('xlink:href', d => `#${d.leafUid}`);
            node.append('text')
                .attr('clip-path', d => `url(#${d.clipUid})`)
                .selectAll('tspan')
                .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
                .join('tspan')
                .attr('x', 0)
                .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
                .text(d => d);
        },
        update => {
            update.select('circle')
                .transition(t)
                .attr('r', d => d.r);
            update.transition(t)
                .attr('transform', d => `translate(${d.x + 1},${d.y + 1})`);
        },
        exit => exit.transition().remove()
        );

}