const fs = require('fs');
const path = require('path');

const translations = {
  ar: { online: "متصل", stats: "إحصائيات", ranking: "تصنيف الوقت" },
  de: { online: "Online", stats: "Statistiken", ranking: "Online-Zeit Ranking" },
  en: { online: "Online", stats: "Statistics", ranking: "Online Time Ranking" },
  es: { online: "En línea", stats: "Estadísticas", ranking: "Clasificación de tiempo" },
  fr: { online: "En ligne", stats: "Statistiques", ranking: "Classement du temps" },
  pl: { online: "Online", stats: "Statystyки", ranking: "Ranking czasu online" },
  pt: { online: "Online", stats: "Estatísticas", ranking: "Ranking de tempo online" },
  uk: { online: "В мережі", stats: "Статистика", ranking: "Рейтинг онлайн-часу" },
  zh: { online: "在线", stats: "统计", ranking: "在线时间排名" }
};

const localesDir = 'C:\\Users\\baneronetwo\\Documents\\GitHub\\timiGS-\\src\\locales';
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const lang = file.replace('.json', '');
  if (!translations[lang]) return;

  const filePath = path.join(localesDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.team) {
    // Create team object before excludeProcesses if possible
    const keys = Object.keys(content);
    const excludeIndex = keys.indexOf('excludeProcesses');
    
    const newContent = {};
    if (excludeIndex !== -1) {
      keys.forEach((key, index) => {
        if (index === excludeIndex) {
          newContent.team = {};
        }
        newContent[key] = content[key];
      });
    } else {
        // Fallback: put before sync if exists, or at the end
        const syncIndex = keys.indexOf('sync');
        if (syncIndex !== -1) {
            keys.forEach((key, index) => {
                if (index === syncIndex) {
                    newContent.team = {};
                }
                newContent[key] = content[key];
            });
        } else {
            Object.assign(newContent, content);
            newContent.team = {};
        }
    }
    content.team = newContent.team;
    // Re-assign to maintain order if we cared about full object reconstruction
    // But since we modified 'content' directly above after deciding where it goes, 
    // it's easier to just rebuild the object if we want order.
    
    // Actually, let's just do it properly:
    const finalContent = {};
    let inserted = false;
    const targetKey = excludeIndex !== -1 ? 'excludeProcesses' : (keys.indexOf('sync') !== -1 ? 'sync' : null);
    
    keys.forEach(key => {
        if (key === targetKey && !inserted) {
            finalContent.team = {};
            inserted = true;
        }
        finalContent[key] = content[key];
    });
    if (!inserted) {
        finalContent.team = {};
    }
    
    // Now fill the team object
    finalContent.team.online = translations[lang].online;
    finalContent.team.stats = translations[lang].stats;
    finalContent.team.ranking = translations[lang].ranking;
    
    fs.writeFileSync(filePath, JSON.stringify(finalContent, null, 2), 'utf8');
  } else {
    // team exists, just add/update keys
    content.team.online = translations[lang].online;
    content.team.stats = translations[lang].stats;
    content.team.ranking = translations[lang].ranking;
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  }
});

console.log('Successfully updated all locale files.');
