#!/usr/bin/env node
/**
 * analyze-topics.js - Análise de temas dos últimos artigos para evitar repetição
 * 
 * Uso:
 *   node scripts/analyze-topics.js [número-de-artigos]
 *   
 * Exemplo:
 *   node scripts/analyze-topics.js 5  # Analisa os últimos 5 artigos
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles');
const COUNT = parseInt(process.argv[2]) || 5;

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const fm = match[1];
  const data = {};
  
  // Extrair campos simples
  const fields = ['title', 'slug', 'type', 'author', 'category', 'date'];
  fields.forEach(field => {
    const fieldMatch = fm.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?`, 'm'));
    if (fieldMatch) data[field] = fieldMatch[1].trim();
  });
  
  // Extrair arrays (tags, teams)
  const tagsMatch = fm.match(/tags:\s*\[([^\]]+)\]/);
  if (tagsMatch) {
    data.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
  }
  
  const teamsMatch = fm.match(/teams:\s*\[([^\]]+)\]/);
  if (teamsMatch) {
    data.teams = teamsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
  }
  
  return data;
}

function getRecentArticles(count) {
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => ({
      name: f,
      path: path.join(ARTICLES_DIR, f),
      mtime: fs.statSync(path.join(ARTICLES_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, count);
  
  return files.map(file => {
    const content = fs.readFileSync(file.path, 'utf-8');
    const fm = extractFrontmatter(content);
    return {
      ...fm,
      filename: file.name,
      mtime: file.mtime
    };
  });
}

function analyzeTopics(articles) {
  const topics = {
    teams: {},
    tags: {},
    types: {},
    authors: {},
    themes: []
  };
  
  articles.forEach(article => {
    // Contar times
    if (article.teams) {
      article.teams.forEach(team => {
        topics.teams[team] = (topics.teams[team] || 0) + 1;
      });
    }
    
    // Contar tags
    if (article.tags) {
      article.tags.forEach(tag => {
        topics.tags[tag] = (topics.tags[tag] || 0) + 1;
      });
    }
    
    // Contar tipos
    if (article.type) {
      topics.types[article.type] = (topics.types[article.type] || 0) + 1;
    }
    
    // Contar autores
    if (article.author) {
      topics.authors[article.author] = (topics.authors[article.author] || 0) + 1;
    }
    
    // Extrair tema principal do título
    if (article.title) {
      const title = article.title.toLowerCase();
      if (title.includes('flamengo') && (title.includes('crise') || title.includes('pressão'))) {
        topics.themes.push({ theme: 'crise-flamengo', title: article.title, date: article.date });
      } else if (title.includes('corinthians') || title.includes('novorizontino')) {
        topics.themes.push({ theme: 'paulistao-semifinal', title: article.title, date: article.date });
      } else if (title.includes('transfer') || title.includes('radar')) {
        topics.themes.push({ theme: 'transferencias', title: article.title, date: article.date });
      } else if (title.includes('fluminense') || title.includes('vasco')) {
        topics.themes.push({ theme: 'carioca-semifinal', title: article.title, date: article.date });
      }
    }
  });
  
  return topics;
}

function generateWarnings(topics, count) {
  const warnings = [];
  
  // Alerta: time com muitos artigos seguidos
  Object.entries(topics.teams).forEach(([team, num]) => {
    if (num >= 3) {
      warnings.push(`⚠️  ALERTA: "${team}" aparece em ${num}/${count} artigos recentes. Risco de saturação.`);
    }
  });
  
  // Alerta: tema repetido
  const themeCounts = {};
  topics.themes.forEach(t => {
    themeCounts[t.theme] = (themeCounts[t.theme] || 0) + 1;
  });
  
  Object.entries(themeCounts).forEach(([theme, num]) => {
    if (num >= 2) {
      warnings.push(`⚠️  ALERTA: Tema "${theme}" já coberto ${num}x nos últimos ${count} artigos.`);
    }
  });
  
  // Alerta: tag repetida
  Object.entries(topics.tags).forEach(([tag, num]) => {
    if (num >= 3 && !['futebol', 'brasileirao'].includes(tag)) {
      warnings.push(`⚠️  ATENÇÃO: Tag "${tag}" usada ${num}x. Verificar se não está repetitivo.`);
    }
  });
  
  return warnings;
}

function main() {
  console.log(`🔍 ANÁLISE DE TEMAS - Últimos ${COUNT} artigos\n`);
  console.log('='.repeat(60));
  
  const articles = getRecentArticles(COUNT);
  const topics = analyzeTopics(articles);
  
  console.log('\n📰 ARTIGOS ANALISADOS:');
  console.log('-'.repeat(60));
  articles.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title || article.filename}`);
    console.log(`   Tipo: ${article.type || 'N/A'} | Autor: ${article.author || 'N/A'}`);
    console.log(`   Times: ${article.teams ? article.teams.join(', ') : 'N/A'}`);
    console.log('');
  });
  
  console.log('\n📊 RESUMO POR CATEGORIA:');
  console.log('-'.repeat(60));
  
  console.log('\nTimes mais mencionados:');
  Object.entries(topics.teams)
    .sort((a, b) => b[1] - a[1])
    .forEach(([team, count]) => {
      const bar = '█'.repeat(count);
      console.log(`  ${team.padEnd(15)} ${bar} ${count}`);
    });
  
  console.log('\nTags mais usadas:');
  Object.entries(topics.tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([tag, count]) => {
      console.log(`  #${tag}: ${count}x`);
    });
  
  console.log('\nTipos de conteúdo:');
  Object.entries(topics.types).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}x`);
  });
  
  console.log('\nTemas identificados:');
  topics.themes.forEach(t => {
    console.log(`  • ${t.theme}: "${t.title.substring(0, 50)}..."`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🚨 ALERTAS DE REPETIÇÃO:');
  console.log('='.repeat(60));
  
  const warnings = generateWarnings(topics, COUNT);
  if (warnings.length > 0) {
    warnings.forEach(w => console.log(w));
  } else {
    console.log('✅ Nenhum alerta. Diversidade de temas está boa.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMENDAÇÕES PARA PRÓXIMO ARTIGO:');
  console.log('='.repeat(60));
  
  // Sugerir temas alternativos
  const saturatedTeams = Object.entries(topics.teams)
    .filter(([_, count]) => count >= 3)
    .map(([team]) => team);
  
  if (saturatedTeams.includes('flamengo')) {
    console.log('• Evitar: Mais artigos sobre Flamengo/crise');
    console.log('• Sugerir: Palmeiras, São Paulo, Grêmio, Internacional');
  }
  
  if (saturatedTeams.includes('corinthians') || saturatedTeams.includes('novorizontino')) {
    console.log('• Evitar: Mais sobre Paulistão (já coberto extensivamente)');
    console.log('• Sugerir: Carioca, Brasileirão, Libertadores');
  }
  
  if (topics.themes.filter(t => t.theme === 'transferencias').length >= 1) {
    console.log('• Radar de transferências já publicado hoje');
    console.log('• Próximo: Análise tática, estatísticas, ou pré-jogo');
  }
  
  console.log('\n✅ TEMAS SEGUROS (pouca ou nenhuma cobertura):');
  const coveredTeams = Object.keys(topics.teams);
  const safeTeams = ['palmeiras', 'sao-paulo', 'gremio', 'internacional', 'cruzeiro', 'atletico-mg']
    .filter(t => !coveredTeams.includes(t));
  if (safeTeams.length > 0) {
    console.log(`  ${safeTeams.join(', ')}`);
  } else {
    console.log('  Todos os times principais já foram cobertos recentemente.');
  }
  
  console.log('\n');
}

main();
