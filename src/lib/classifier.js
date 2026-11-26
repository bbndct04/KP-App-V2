let modelPromise = null

export function loadModel() {
  if (!modelPromise) {
    modelPromise = fetch('/models/complaint-nb.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => (m ? { ...m, stopSet: new Set(m.stop) } : null))
      .catch(() => null)
  }
  return modelPromise
}

function features(text, model) {
  const tokens = (text.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) || []).filter((w) => !model.stopSet.has(w))
  const feats = [...tokens]
  for (let n = 2; n <= model.ngram; n++) {
    for (let i = 0; i + n <= tokens.length; i++) feats.push(tokens.slice(i, i + n).join(' '))
  }
  return feats
}

export function classify(model, text) {
  if (!model || !text) return []
  const scores = [...model.prior]
  let known = 0
  for (const f of features(text, model)) {
    const row = model.vocab[f]
    if (!row) continue
    known++
    for (let c = 0; c < scores.length; c++) scores[c] += row[c]
  }
  if (known === 0) return []
  const max = Math.max(...scores)
  const exp = scores.map((s) => Math.exp(s - max))
  const sum = exp.reduce((a, b) => a + b, 0)
  return model.classes
    .map((category, i) => ({ category, probability: exp[i] / sum }))
    .sort((a, b) => b.probability - a.probability)
}
