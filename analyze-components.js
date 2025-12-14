const fs = require('fs');

const data = JSON.parse(fs.readFileSync('figma-design-tokens.json', 'utf8'));

function analyzeNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let output = `${indent}- ${node.name} (${node.type})`;

  // Add dimensions if available
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    output += ` [${Math.round(width)}x${Math.round(height)}px]`;
  }

  // Add style information
  if (node.fills && node.fills.length > 0) {
    const solidFills = node.fills.filter(f => f.type === 'SOLID');
    if (solidFills.length > 0) {
      output += ` | Fill`;
    }
  }

  if (node.characters) {
    output += ` | Text: "${node.characters.substring(0, 30)}${node.characters.length > 30 ? '...' : ''}"`;
  }

  console.log(output);

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => analyzeNode(child, depth + 1));
  }
}

console.log('\n🏗️  Component Hierarchy: Kalender_Examensmodus\n');
console.log('='.repeat(60));

if (data.specificNode) {
  analyzeNode(data.specificNode);
} else {
  console.log('❌ Node not found');
}

// Generate component structure summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 Component Summary:\n');

function extractComponents(node, components = []) {
  if (node.type === 'FRAME' && node.name && !node.name.startsWith('Vector')) {
    components.push({
      name: node.name,
      type: node.type,
      childCount: node.children ? node.children.length : 0
    });
  }

  if (node.children) {
    node.children.forEach(child => extractComponents(child, components));
  }

  return components;
}

const components = extractComponents(data.specificNode);
components.forEach((comp, idx) => {
  console.log(`${idx + 1}. ${comp.name} (${comp.childCount} children)`);
});

console.log(`\n✅ Total components: ${components.length}`);
