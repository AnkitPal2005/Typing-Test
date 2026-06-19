import { NextResponse } from 'next/server';

const easyWords = ["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because"];
const mediumWords = ["company", "number", "system", "different", "always", "during", "another", "government", "problem", "however", "provide", "without", "program", "question", "important", "family", "business", "example", "ability", "produce", "academic", "accept", "activity", "industry", "practice", "physical", "science", "position", "project", "national", "security", "personal", "general", "process", "special", "subject", "support", "service", "control", "develop", "include", "explain", "history", "standard", "strength", "analysis", "consider", "continue", "decision", "describe", "economic", "evidence", "identify", "increase", "interest", "language", "movement", "material", "official", "possible"];
const hardWords = ["responsibility", "characterization", "accomplishment", "environmental", "interpretation", "representative", "administration", "investigation", "professionalism", "misunderstanding", "recommendation", "multiculturalism", "commercialization", "unconstitutional", "counterintelligence", "industrialization", "interdisciplinary", "misrepresentation", "decentralization", "re-establishment", "disproportionate", "entrepreneurship", "operationalization", "telecommunication", "hyper-responsibility"];
const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "12", "45", "99", "100", "250", "999", "1000", "1994", "2026", "10500", "3.14", "9.81", "1.618", "42", "73", "1234", "8888", "101", "24/7", "50-50"];
const punctuation = ["hello!", "what?", "yes,", "no.", "up/down", "one;two", "user@domain.com", "typing-test", "site.css", "program.cs", "#hashtag", "$100", "50%", "test&run", "parent(child)", "value[index]", "key:value", "quote's", "\"speech\"", "a=b+c"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty') || 'easy';
  const count = parseInt(searchParams.get('count') || '100', 10);

  let sourceList = easyWords;
  if (difficulty === 'medium') sourceList = mediumWords;
  else if (difficulty === 'hard') sourceList = hardWords;
  else if (difficulty === 'numbers') sourceList = numbers;
  else if (difficulty === 'punctuation') sourceList = punctuation;

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * sourceList.length);
    result.push(sourceList[randomIndex]);
  }

  return NextResponse.json(result);
}
