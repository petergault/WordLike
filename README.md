# WordLike - Vocabulary Game

A fun and interactive vocabulary game where players test their knowledge by guessing synonyms for target words.

## How to Play

1. Open `index.html` in a web browser
2. Click "Start Game" to begin
3. You'll see a target word with its definition
4. Type synonyms for the word within the 60-second time limit
5. Earn points based on how quickly you guess each synonym (fewer revealed letters = more points)
6. Goal: Get at least 5 words correct per round
7. Progress through 120 rounds with words of increasing difficulty

## Game Features

- **120 Word Levels**: From elementary to high school vocabulary
- **Smart Hint System**: Letters reveal automatically during inactivity
- **Points System**: Earn more points for guessing words early
- **High Scores**: Track your top 10 performances
- **Progressive Difficulty**: Words organized by grade level
- **Beautiful UI**: Modern, responsive design with smooth animations

## Scoring

Points are calculated based on the number of letters revealed:
- Guess with only 1 letter shown: Maximum points (word length - 1)
- More letters revealed: Fewer points
- Letters auto-reveal every second if you're inactive

## Technologies Used

- Pure HTML5
- CSS3 with animations
- Vanilla JavaScript
- localStorage for high score persistence

## Getting Started

Simply open `index.html` in any modern web browser. No build process or dependencies required!

## Game Data

The game includes 120 carefully curated words with:
- Target word
- Clear definition
- 10 synonyms per word
- Grade level classification (Elementary, Middle School, High School)

Enjoy expanding your vocabulary!
