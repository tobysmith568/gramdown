Start of document.

This has `inline code` words.

```
This is plain text in a code block.
```

The next code block is JavaScript:

```
export const joinWords = (words) => {
  const joinedWords = words.join("");
  return joinedWords;
}
```

The next code block is C#:

```
public static string JoinWords(IEnumerable<string> words)
{
    var joinedWords = string.Join("", words);
    return joinedWords;
}
```

Now we have two code blocks that are back to back:

```
// This is code block one
```

```
// This is code block two
```

End of document.
