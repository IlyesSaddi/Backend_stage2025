require('dotenv').config();

const express = require("express");
const { graphqlHTTP } = require('express-graphql');  // graphqlHTTP est bien une fonction qu'on appelle avec un objet de config.
const mongoose = require('mongoose');
const graphqlschema = require('./graphql/schema/index')
const graphqlresolver = require('./graphql/resolvers/index')

const isAuth = require('./middleware/is_auth');
const cors = require('cors');
const User = require('./models/User');
const { askBedrock } = require('./services/bedrockService');

const app = express();
const INTENT_MODE = (process.env.INTENT_MODE || 'static').toLowerCase();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripInterpretationNoise = (value = '') => {
  return String(value)
    .toLowerCase()
    .replace(/\b(interprete|interprete|interpr\s*ete|interpr\s*et\s*e|interpret|interpreted)\b/g, ' ')
    .replace(/\b(comme|as|:|;|->|=>)\b/g, ' ')
    .replace(/\b(scenario|scénario|scenari|reconnu|resultat|résultat)\b/g, ' ')
    .replace(/\b(ia|llm|bedrock|aws|nova|micro)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const collapseRepeatedLetters = (word = '') => {
  return String(word).replace(/([a-z])\1{2,}/g, '$1');
};

const simplifyForMatch = (value = '') => {
  let text = normalizeText(stripInterpretationNoise(value));
  text = text
    .replace(/\bcreer\b|\bcreate\b|\bcrrer\b|\bcrer\b/g, 'creer')
    .replace(/\bcompagnie\b|\bcompany\b|\bentreprise\b|\bsociete\b|\bsociet\b/g, 'compagnie')
    .replace(/\bdevice\b|\bdispositif\b|\bappareil\b/g, 'device')
    .replace(/\bmdp\b|\bmot de passe\b|\bpassword\b/g, 'motdepasse')
    .replace(/\boublie\b|\boublier\b|\bforgot\b/g, 'oublie')
    .replace(/\bconnexion\b|\blogin\b|\bconnecter\b/g, 'connexion')
    .replace(/\bdev\b|\bdevv\b/g, 'device')
    .replace(/\bsupprimer\b|\bdelete\b|\beffacer\b|\bremove\b/g, 'supprimer')
    .replace(/\bunn\b|\bun\b/g, 'un');

  return text
    .split(' ')
    .map((word) => collapseRepeatedLetters(word))
    .join(' ')
    .trim();
};

const levenshtein = (a = '', b = '') => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const fuzzyIncludes = (sourceText, targetText) => {
  const normalizedSource = simplifyForMatch(sourceText);
  const normalizedTarget = simplifyForMatch(targetText);

  if (!normalizedSource || !normalizedTarget) return false;
  if (normalizedSource.includes(normalizedTarget)) return true;
  if (normalizedTarget.includes(normalizedSource)) return true;

  const sourceWords = normalizedSource.split(' ');
  const targetWords = normalizedTarget.split(' ');
  const common = sourceWords.filter((word) => targetWords.includes(word));
  if (common.length > 0 && common.length >= Math.min(sourceWords.length, targetWords.length) * 0.5) {
    return true;
  }

  return levenshtein(normalizedSource, normalizedTarget) <= 3;
};

const aiTestCatalog = [
  {
    phrase: 'créer une compagnie',
    name: 'Créer une compagnie',
    steps: 4,
    prompt: 'Créer une compagnie',
    aliases: ['creer compagnie', 'creer une compagnie', 'ajouter compagnie', 'new company', 'create company', 'creation compagnie', 'crrer companiyy', 'crrer company', 'creer companiy', 'creer societe'],
    tests: [
      'Ouvrir le module de gestion des sociétés.',
      'Remplir le nom de la société et les informations obligatoires.',
      'Cliquer sur créer puis vérifier le message de confirmation.',
      'Contrôler que la société est bien visible dans la liste.'
    ],
    regex: /(creer|create|ajouter).*(compagn|societ|entreprise|company)|compagn|societ|entreprise|company/,
  },
  {
    phrase: 'créer un device',
    name: 'Créer un device',
    steps: 3,
    prompt: 'Créer un device',
    aliases: ['creer un device', 'creer device', 'ajouter un device', 'nouveau device', 'device'],
    tests: [
      'Ouvrir le formulaire de création de device.',
      'Saisir les informations requises et valider le formulaire.',
      'Vérifier l’apparition du message de succès et la présence du device en base.'
    ],
    regex: /(creer|create|ajouter).*(device|dispositif)|device|dispositif/,
  },
  {
    phrase: 'supprimer un device',
    name: 'Supprimer un device',
    steps: 3,
    prompt: 'Supprimer un device',
    aliases: ['supprimer un device', 'supprimer device', 'delete device', 'suppression device', 'supprimer unn device', 'supprimer un dispositif', 'delete dispositif'],
    tests: [
      'Identifier le device à supprimer.',
      'Valider la confirmation de suppression.',
      'Vérifier que le device a bien disparu de la liste et de la base.'
    ],
    regex: /(supprimer|delete|effacer|remove).*(device|dispositif)|device.*(supprimer|delete|effacer)|supprimer.*device/,
  },
  {
    phrase: 'connexion utilisateur',
    name: 'Connexion utilisateur',
    steps: 4,
    prompt: 'Se connecter',
    aliases: ['login utilisateur', 'se connecter', 'connexion', 'connecter', 'login'],
    tests: [
      'Ouvrir la page de connexion.',
      'Saisir un email valide et un mot de passe correct.',
      'Valider le formulaire et vérifier la redirection vers le dashboard.',
      'Vérifier la présence du token utilisateur et l’accès aux pages protégées.'
    ],
    regex: /connexion|login|se connecter|connecter|user.*login/,
  },
  {
    phrase: 'oublie du mot de passe',
    name: 'Mot de passe oublié',
    steps: 3,
    prompt: 'Mot de passe oublié',
    aliases: ['oublie mot de passe', 'oublier mot de passe', 'mot de passe oublie', 'mdp oublie', 'reset password', 'reinitialisation mot de passe', 'oublie du mdp'],
    tests: [
      'Cliquer sur “Mot de passe oublié”.',
      'Saisir l’email associé au compte et soumettre la demande.',
      'Vérifier l’envoi du mail de réinitialisation et l’accès au formulaire de reset.'
    ],
    regex: /oublie.*mot de passe|mot de passe.*oublie|oublier.*mot de passe|mdp.*oublie|reset.*password|reinitial.*mot de passe/,
  },
];

const fallbackIntentResolver = (query) => {
  const simplifiedQuery = simplifyForMatch(query);

  if (/(supprimer|delete|effacer|remove)/.test(simplifiedQuery) && /(device|dispositif|dev|devv)/.test(simplifiedQuery)) {
    return aiTestCatalog.find((item) => item.name.includes('Supprimer un device'));
  }

  if (/(supprimer|delete|effacer|remove)/.test(simplifiedQuery) && /(compagn|societ|entreprise|company)/.test(simplifiedQuery)) {
    return aiTestCatalog.find((item) => item.name.includes('compagnie'));
  }

  if (/(device|dispositif|dev|devv)/.test(simplifiedQuery)) {
    return aiTestCatalog.find((item) => item.name.includes('Créer un device'));
  }

  if (/(compagn|societ|entreprise|company)/.test(simplifiedQuery)) {
    return aiTestCatalog.find((item) => item.name.includes('compagnie'));
  }

  if (/(connexion|login|connecter)/.test(simplifiedQuery)) {
    return aiTestCatalog.find((item) => item.name.includes('Connexion'));
  }

  if (/(oublie|motdepasse|mdp|reset)/.test(simplifiedQuery)) {
    return aiTestCatalog.find((item) => item.name.includes('Mot de passe'));
  }

  const scoredMatches = aiTestCatalog.map((item) => {
    let score = 0;
    const simplifiedItemPhrase = simplifyForMatch(item.phrase);

    if (item.regex.test(simplifiedQuery)) score += 40;
    if (item.aliases.some((alias) => simplifyForMatch(alias) === simplifiedQuery)) score += 100;
    if (item.aliases.some((alias) => simplifiedQuery.includes(simplifyForMatch(alias)))) score += 50;
    if (simplifiedQuery.includes(simplifiedItemPhrase)) score += 30;
    if (fuzzyIncludes(query, item.phrase)) score += 20;

    return { item, score };
  });

  return scoredMatches.sort((a, b) => b.score - a.score)[0]?.item || null;
};

const resolveWithBedrock = async (query) => {
  try {
    const options = aiTestCatalog.map((item) => ({
      name: item.name,
      phrase: item.phrase,
      aliases: item.aliases,
    }));

    const prompt = `Tu es un interpréteur d’intentions pour une application SaaS. 

Règles strictes:
- Réponds en JSON uniquement.
- Le texte utilisateur est: "${query}".
- Ignore les libellés parasites comme "interprété comme", "Scénario reconnu", "résultat", "IA", "LLM", "Bedrock", "AWS", "Nova", "Micro".
- Choisis UNE seule intention parmi cette liste:
${JSON.stringify(options, null, 2)}
- Si le texte contient des éléments comme company, compagnie, entreprise, societe, choisis "Créer une compagnie".
- Si le texte parle d'un device, device, dev, dispositifs, choisis "Créer un device".
- Si le texte parle de connexion/login/connect, choisis "Connexion utilisateur".
- Si le texte parle de mot de passe oublié/reset/mdp, choisis "Mot de passe oublié".
- Retourne exactement: {"name":"..."}
- N'invente rien.
`;

    const response = await askBedrock(prompt);
    const cleaned = String(response || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const item = aiTestCatalog.find((entry) => entry.name === parsed.name || entry.phrase === parsed.name);
    if (item) return item;
  } catch (error) {
    console.warn('Bedrock fallback used:', error.message);
  }

  return null;
};

app.post('/api/resolve', async (req, res) => {
  const query = (req.body?.query || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    if (INTENT_MODE === 'bedrock') {
      const bedrockMatch = await resolveWithBedrock(query);
      if (bedrockMatch) {
        return res.json({
          matched: {
            name: bedrockMatch.name,
            steps: bedrockMatch.steps,
            prompt: bedrockMatch.prompt,
            tests: bedrockMatch.tests,
          },
        });
      }
    }

    const resolved = fallbackIntentResolver(query);
    if (resolved) {
      return res.json({
        matched: {
          name: resolved.name,
          steps: resolved.steps,
          prompt: resolved.prompt,
          tests: resolved.tests,
        },
      });
    }

    if (INTENT_MODE !== 'static') {
      const bedrockMatch = await resolveWithBedrock(query);
      if (bedrockMatch) {
        return res.json({
          matched: {
            name: bedrockMatch.name,
            steps: bedrockMatch.steps,
            prompt: bedrockMatch.prompt,
            tests: bedrockMatch.tests,
          },
        });
      }
    }
  } catch (error) {
    console.warn('Bedrock intent resolution failed:', error.message);
  }

  return res.json({
    suggestions: aiTestCatalog.map((item) => ({
      name: item.name,
      phrase: item.phrase,
    })),
  });
});

app.post('/api/run', (req, res) => {
  const query = (req.body?.query || '').trim();
  const fresh = Boolean(req.body?.fresh);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(`Test reçu : ${query || 'aucune requête'}\n`);
  res.write(`Mode fresh : ${fresh ? 'oui' : 'non'}\n`);
  res.write('Exécution du test simulé...\n');
  res.write('✅ Résultat : test OK\n');
  res.end();
});

app.use(isAuth);

app.use('/graphql',
  graphqlHTTP((req) => ({
    schema: graphqlschema,
    rootValue: graphqlresolver,
    graphiql: true,
    context: req,  // ajoute le contexte : ici c’est l’objet req complet
  }))
);


app.get('/',(req,res,next) => {
    res.send("Hello World");
})

  app.get('/confirm/:token', async (req, res) => {
  try {
    const user = await User.findOne({ confirmationToken: req.params.token });
    if (!user) return res.status(400).send("Invalid token");

    user.isConfirmed = true;
    user.confirmationToken = null;
    await user.save();

    res.send("✅ Account confirmed! You can now log in.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});





mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.qjf998c.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`
).then(() => {
    app.listen(8000, () => console.log("✅ Server running on http://localhost:8000"));
  })
  .catch(err => {
    console.log("❌ Erreur de connexion MongoDB : ", err);
  });





