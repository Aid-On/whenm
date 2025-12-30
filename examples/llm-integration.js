/**
 * LLM Integration Example
 * Shows how to use WhenM with LLM for natural language understanding
 */

import { createGroqEngine } from '../dist/index.js';

async function llmIntegrationExample() {
  // Create engine with Groq LLM
  const engine = await createGroqEngine(
    process.env.GROQ_API_KEY,
    'llama-3.3-70b-versatile'
  );

  console.log('=== LLM Integration Example ===\n');
  console.log('Using natural language to interact with temporal memory\n');

  // Natural language event recording
  const naturalEvents = [
    "John started working at Google as a software engineer in January 2020",
    "He learned Go and Kubernetes during his first year",
    "John got promoted to senior engineer in March 2022",
    "He moved from Mountain View to Seattle in June 2022",
    "John started a side project called 'TimeTracker' in September 2022",
    "He presented at GopherCon in November 2022",
    "John became a tech lead in January 2023",
    "He hired two junior engineers for his team in March 2023",
    "John's TimeTracker project got acquired in August 2023",
    "He started mentoring at a coding bootcamp in September 2023",
  ];

  // Record events with automatic date extraction
  console.log('Recording natural language events...\n');
  for (const event of naturalEvents) {
    await engine.remember(event);
    console.log(`Recorded: ${event}`);
  }

  console.log('\n--- Natural Language Queries ---\n');

  // Complex natural language queries
  const queries = [
    {
      question: "What was John's role when he moved to Seattle?",
      date: '2022-06-15'
    },
    {
      question: "Did John know Kubernetes before becoming a tech lead?",
      date: '2023-01-01'
    },
    {
      question: "What happened to John's side project?",
      date: '2023-12-01'
    },
    {
      question: "How many people did John hire for his team?",
      date: '2023-06-01'
    },
    {
      question: "Was John doing any teaching or mentoring activities?",
      date: '2023-10-01'
    },
    {
      question: "What technical skills did John acquire at Google?",
      date: '2023-01-01'
    },
    {
      question: "Tell me about John's career progression at Google",
      date: '2023-12-01'
    }
  ];

  for (const { question, date } of queries) {
    const result = await engine.ask(question, date);
    console.log(`Q: ${question}`);
    console.log(`A: ${result}`);
    if (result.confidence) {
      console.log(`   (Confidence: ${result.confidence})`);
    }
    console.log();
  }

  // Reasoning chain example
  console.log('--- Reasoning Chain Example ---\n');
  
  const reasoning = await engine.ask(
    "Based on John's career trajectory, what would be a logical next step for him?",
    '2024-01-01'
  );
  
  console.log('Question: What would be a logical next career step?');
  console.log('Answer:', reasoning);
}

// Note: Requires GROQ_API_KEY environment variable
if (process.env.GROQ_API_KEY) {
  llmIntegrationExample().catch(console.error);
} else {
  console.log('Please set GROQ_API_KEY environment variable to run this example');
  console.log('Get your API key from: https://console.groq.com/keys');
}