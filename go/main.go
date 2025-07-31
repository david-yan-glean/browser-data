package main

import (
	"bytes"
	"fmt"
	"os"
	"slices"
	"strings"

	"github.com/pkg/diff"
)

var (
	cEditPrefixes = []string{"+", "-"}
)

func main() {
	// Check if we have exactly 2 file arguments
	if len(os.Args) != 3 {
		fmt.Println("Usage: go run main.go <file1> <file2>")
		fmt.Println("Example: go run main.go old.txt new.txt")
		os.Exit(1)
	}

	file1Path := os.Args[1]
	file2Path := os.Args[2]

	// Read the first file
	file1Lines, err := readFileLines(file1Path)
	if err != nil {
		fmt.Printf("Error reading file %s: %v\n", file1Path, err)
		os.Exit(1)
	}

	// Read the second file
	file2Lines, err := readFileLines(file2Path)
	if err != nil {
		fmt.Printf("Error reading file %s: %v\n", file2Path, err)
		os.Exit(1)
	}

	// Convert file contents to character slices
	file1Content := strings.Join(file1Lines, "\n")
	file2Content := strings.Join(file2Lines, "\n")

	// Break up strings into lists of characters
	file1Chars := strings.Split(file1Content, "")
	file2Chars := strings.Split(file2Content, "")

	// Create a buffer to capture the diff output
	var buf bytes.Buffer
	diff.Slices("file1", "file2", file1Chars, file2Chars, &buf)

	// Convert buffer to string and print
	diffOutput := buf.String()
	diffLines := strings.Split(diffOutput, "\n")
	lastEdit := ""
	lastEditIndex := 0
	editBuffer := strings.Builder{}
	for i, line := range diffLines {
		if len(line) < 2 {
			continue
		}
		if slices.Contains(cEditPrefixes, string(line[0])) && !slices.Contains(cEditPrefixes, string(line[1])) {
			if lastEdit != string(line[0]) || lastEditIndex != i-1 {
				lastEdit = string(line[0])
				lastEditIndex = i
				if editBuffer.Len() > 0 {
					fmt.Printf("%s%s\n", lastEdit, editBuffer.String())
					editBuffer.Reset()
				}
			} else {
				lastEditIndex = i
			}
			editBuffer.WriteString(line[1:])
		} else {
			if lastEdit != "" {
				fmt.Printf("%s%s\n", lastEdit, editBuffer.String())
				editBuffer.Reset()
				lastEdit = ""
				lastEditIndex = 0
			}
			fmt.Printf("%s\n", line)
		}
	}
}

// readFileLines reads a file and returns its lines with a large buffer
func readFileLines(filename string) ([]string, error) {
	// Read entire file into memory first to avoid scanner token limits
	content, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	// Split content by newlines
	lines := strings.Split(string(content), "\n")

	// Remove trailing empty line if file ends with newline
	if len(lines) > 0 && lines[len(lines)-1] == "" {
		lines = lines[:len(lines)-1]
	}

	return lines, nil
}

// computeDiff implements the Myers diff algorithm
func computeDiff(file1, file2 []string) {
	// Myers algorithm implementation
	edits := myersDiff(file1, file2)

	// Apply the edits to generate diff output
	i, j := 0, 0
	for _, edit := range edits {
		switch edit.Type {
		case '=':
			fmt.Printf("  %s\n", file1[i])
			i++
			j++
		case '-':
			fmt.Printf("- %s\n", file1[i])
			i++
		case '+':
			fmt.Printf("+ %s\n", file2[j])
			j++
		}
	}
}

// Edit represents a single edit operation
type Edit struct {
	Type byte // '=', '-', '+'
}

// myersDiff implements the Myers diff algorithm
func myersDiff(a, b []string) []Edit {
	n, m := len(a), len(b)

	// Handle empty files
	if n == 0 && m == 0 {
		return []Edit{}
	}
	if n == 0 {
		edits := make([]Edit, m)
		for i := range edits {
			edits[i] = Edit{Type: '+'}
		}
		return edits
	}
	if m == 0 {
		edits := make([]Edit, n)
		for i := range edits {
			edits[i] = Edit{Type: '-'}
		}
		return edits
	}

	// Myers algorithm implementation
	return myersDiffImpl(a, b)
}

// myersDiffImpl implements the core Myers algorithm
func myersDiffImpl(a, b []string) []Edit {
	n, m := len(a), len(b)
	max := n + m

	// Handle the case where max is 0 (shouldn't happen after empty checks)
	if max == 0 {
		return []Edit{}
	}

	// Create the edit distance matrix
	// v[k] represents the furthest reaching D-path ending at diagonal k
	v := make([]int, 2*max+1)
	for i := range v {
		v[i] = -1
	}
	v[max] = 0 // Start at origin

	// Find the shortest edit script
	for d := 0; d <= max; d++ {
		// Try each diagonal
		for k := -d; k <= d; k += 2 {
			var x int

			// Choose the best previous diagonal
			if k == -d || (k != d && v[max+k-1] < v[max+k+1]) {
				// Come from diagonal k+1 (down)
				x = v[max+k+1]
			} else {
				// Come from diagonal k-1 (right)
				x = v[max+k-1] + 1
			}

			y := x - k

			// Follow diagonal as far as possible (snake)
			for x < n && y < m && a[x] == b[y] {
				x++
				y++
			}

			v[max+k] = x

			// Check if we've reached the end
			if x >= n && y >= m {
				return reconstructPath(a, b, v, max, d, k, x, y)
			}
		}
	}

	// Should not reach here for valid inputs
	return []Edit{}
}

// reconstructPath reconstructs the edit path from the Myers algorithm
func reconstructPath(a, b []string, v []int, max, d, k, x, y int) []Edit {
	edits := make([]Edit, 0, len(a)+len(b))

	// Backtrack from the end point
	for d > 0 {
		// Determine which diagonal we came from
		var prevK int
		if k == -d || (k != d && v[max+k-1] < v[max+k+1]) {
			prevK = k + 1 // Came from diagonal k+1 (down)
		} else {
			prevK = k - 1 // Came from diagonal k-1 (right)
		}

		prevX := v[max+prevK]
		prevY := prevX - prevK

		// Add diagonal moves (snake)
		for x > prevX && y > prevY {
			edits = append([]Edit{{Type: '='}}, edits...)
			x--
			y--
		}

		// Add the edit that got us to this diagonal
		if prevK > k {
			// Came from above (insertion in b)
			edits = append([]Edit{{Type: '+'}}, edits...)
		} else {
			// Came from left (deletion from a)
			edits = append([]Edit{{Type: '-'}}, edits...)
		}

		k = prevK
		x = prevX
		y = prevY
		d--
	}

	// Add remaining diagonal moves from origin
	for x > 0 && y > 0 {
		edits = append([]Edit{{Type: '='}}, edits...)
		x--
		y--
	}

	// Reverse to get correct order
	for i, j := 0, len(edits)-1; i < j; i, j = i+1, j-1 {
		edits[i], edits[j] = edits[j], edits[i]
	}

	return edits
}
