#!/usr/bin/env node

/**
 * Add Contest-Only Problems Script
 * Adds LeetCode problems: Majority Element II, Kth Largest Element, LCA of BST, Contains Duplicate
 * All problems are marked as contest-only and include comprehensive test cases
 */

import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Generate large test case arrays as strings
function generateLargeArray(size, generator) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push(generator(i));
  }
  return '[' + arr.join(',') + ']';
}

// Problem definitions with comprehensive test cases
const contestProblems = [
  // ==================== CONTAINS DUPLICATE ====================
  {
    title: "Contains Duplicate",
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    difficulty: "Easy",
    constraints: `• 1 <= nums.length <= 10^5
• -10^9 <= nums[i] <= 10^9`,
    examples: [
      {
        input: "nums = [1,2,3,1]",
        output: "true",
        explanation: "The element 1 appears at indices 0 and 3."
      },
      {
        input: "nums = [1,2,3,4]",
        output: "false",
        explanation: "All elements are distinct."
      },
      {
        input: "nums = [1,1,1,3,3,4,3,2,4,2]",
        output: "true",
        explanation: "Multiple elements appear more than once."
      }
    ],
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
      { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
      { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: false },
      { input: "[1]", expectedOutput: "false", isHidden: true },
      { input: "[1,1]", expectedOutput: "true", isHidden: true },
      { input: "[0,0]", expectedOutput: "true", isHidden: true },
      { input: "[-1,1,-1]", expectedOutput: "true", isHidden: true },
      { input: "[1,2,3,4,5,6,7,8,9,10]", expectedOutput: "false", isHidden: true },
      // Large: no duplicates (n=100000)
      { input: generateLargeArray(100000, i => i), expectedOutput: "false", isHidden: true },
      // Large: duplicate at end (n=100000)
      { input: generateLargeArray(100000, i => i === 99999 ? 0 : i), expectedOutput: "true", isHidden: true },
      // Large: all same (n=50000)
      { input: generateLargeArray(50000, () => 42), expectedOutput: "true", isHidden: true },
    ],
    functionSignatures: {
      javascript: `function containsDuplicate(nums) {
    // Your code here
}`,
      python: `def contains_duplicate(nums):
    # Your code here
    pass`,
      java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Your code here
        return false;
    }
}`,
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Your code here
        return false;
    }
};`,
      c: `bool containsDuplicate(int* nums, int numsSize) {
    // Your code here
    return false;
}`
    },
    languageBoilerplate: {
      javascript: `function containsDuplicate(nums) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim();
const nums = input.replace(/[\\[\\]]/g, '').split(',').filter(x => x).map(x => parseInt(x));
const result = containsDuplicate(nums);
console.log(result ? 'true' : 'false');`,

      python: `def contains_duplicate(nums):
    # Your code here
    pass

# Driver code
import sys
import re
input_str = sys.stdin.read().strip()
nums_str = re.sub(r'[\\[\\]]', '', input_str)
nums = [int(x) for x in nums_str.split(',') if x]
result = contains_duplicate(nums)
print('true' if result else 'false')`,

      java: `import java.util.*;
import java.io.*;

public class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Your code here
        return false;
    }
    
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine().replace("[", "").replace("]", "");
        String[] parts = line.split(",");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i].trim());
        }
        
        Solution sol = new Solution();
        boolean result = sol.containsDuplicate(nums);
        System.out.println(result ? "true" : "false");
    }
}`,

      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Your code here
        return false;
    }
};

int main() {
    string line;
    getline(cin, line);
    
    vector<int> nums;
    line = line.substr(1, line.length() - 2);
    stringstream ss(line);
    string num;
    while (getline(ss, num, ',')) {
        nums.push_back(stoi(num));
    }
    
    Solution sol;
    bool result = sol.containsDuplicate(nums);
    cout << (result ? "true" : "false") << endl;
    
    return 0;
}`,

      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

bool containsDuplicate(int* nums, int numsSize) {
    // Your code here
    return false;
}

int main() {
    char line[2000000];
    fgets(line, sizeof(line), stdin);
    
    int nums[100000];
    int numsSize = 0;
    char* token = strtok(line, "[,]\\n");
    while (token != NULL) {
        nums[numsSize++] = atoi(token);
        token = strtok(NULL, "[,]\\n");
    }
    
    bool result = containsDuplicate(nums, numsSize);
    printf("%s\\n", result ? "true" : "false");
    
    return 0;
}`
    },
    hints: [
      "Use a hash set to track elements you've seen.",
      "If you encounter an element that's already in the set, return true.",
      "Time complexity should be O(n) with O(n) space."
    ],
    tags: ["Array", "Hash Table", "Sorting"],
    timeLimit: 30,
    memoryLimit: 128,
    isActive: true,
    isContestOnly: true
  },

  // ==================== MAJORITY ELEMENT II ====================
  {
    title: "Majority Element II",
    description: `Given an integer array of size n, find all elements that appear more than ⌊n/3⌋ times.`,
    difficulty: "Medium",
    constraints: `• 1 <= nums.length <= 5 * 10^4
• -10^9 <= nums[i] <= 10^9

**Follow up:** Could you solve the problem in linear time and in O(1) space?`,
    examples: [
      {
        input: "nums = [3,2,3]",
        output: "[3]",
        explanation: "3 appears 2 times which is more than ⌊3/3⌋ = 1 time."
      },
      {
        input: "nums = [1]",
        output: "[1]",
        explanation: "1 appears 1 time which is more than ⌊1/3⌋ = 0 times."
      },
      {
        input: "nums = [1,2]",
        output: "[1,2]",
        explanation: "Both elements appear once, which is more than ⌊2/3⌋ = 0 times."
      }
    ],
    testCases: [
      { input: "[3,2,3]", expectedOutput: "[3]", isHidden: false },
      { input: "[1]", expectedOutput: "[1]", isHidden: false },
      { input: "[1,2]", expectedOutput: "[1,2]", isHidden: false },
      { input: "[2,2]", expectedOutput: "[2]", isHidden: true },
      { input: "[1,1,1,3,3,2,2,2]", expectedOutput: "[1,2]", isHidden: true },
      { input: "[1,2,3,4,5]", expectedOutput: "[]", isHidden: true },
      { input: "[0,0,0]", expectedOutput: "[0]", isHidden: true },
      { input: "[-1,-1,2,2,-1]", expectedOutput: "[-1,2]", isHidden: true },
      // Large: single majority (n=50000, 999 appears 40000 times)
      { input: generateLargeArray(50000, i => i < 40000 ? 999 : i), expectedOutput: "[999]", isHidden: true },
      // Large: two majorities (n=30000: 1 appears 12000, 2 appears 11000, 3 appears 7000)
      { input: generateLargeArray(30000, i => i < 12000 ? 1 : (i < 23000 ? 2 : 3)), expectedOutput: "[1,2]", isHidden: true },
      // Large: no majority (n=30000)
      { input: generateLargeArray(30000, i => i % 15000), expectedOutput: "[]", isHidden: true },
    ],
    functionSignatures: {
      javascript: `function majorityElement(nums) {
    // Your code here
}`,
      python: `def majority_element(nums):
    # Your code here
    pass`,
      java: `class Solution {
    public List<Integer> majorityElement(int[] nums) {
        // Your code here
        return new ArrayList<>();
    }
}`,
      cpp: `class Solution {
public:
    vector<int> majorityElement(vector<int>& nums) {
        // Your code here
        return {};
    }
};`,
      c: `int* majorityElement(int* nums, int numsSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}`
    },
    languageBoilerplate: {
      javascript: `function majorityElement(nums) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim();
const nums = input.replace(/[\\[\\]]/g, '').split(',').filter(x => x).map(x => parseInt(x));
const result = majorityElement(nums);
result.sort((a, b) => a - b);
console.log('[' + result.join(',') + ']');`,

      python: `def majority_element(nums):
    # Your code here
    pass

# Driver code
import sys
import re
input_str = sys.stdin.read().strip()
nums_str = re.sub(r'[\\[\\]]', '', input_str)
nums = [int(x) for x in nums_str.split(',') if x]
result = majority_element(nums)
result.sort()
print('[' + ','.join(map(str, result)) + ']')`,

      java: `import java.util.*;
import java.io.*;

public class Solution {
    public List<Integer> majorityElement(int[] nums) {
        // Your code here
        return new ArrayList<>();
    }
    
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine().replace("[", "").replace("]", "");
        String[] parts = line.split(",");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i].trim());
        }
        
        Solution sol = new Solution();
        List<Integer> result = sol.majorityElement(nums);
        Collections.sort(result);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < result.size(); i++) {
            sb.append(result.get(i));
            if (i < result.size() - 1) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb.toString());
    }
}`,

      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> majorityElement(vector<int>& nums) {
        // Your code here
        return {};
    }
};

int main() {
    string line;
    getline(cin, line);
    
    vector<int> nums;
    line = line.substr(1, line.length() - 2);
    stringstream ss(line);
    string num;
    while (getline(ss, num, ',')) {
        nums.push_back(stoi(num));
    }
    
    Solution sol;
    vector<int> result = sol.majorityElement(nums);
    sort(result.begin(), result.end());
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << result[i];
        if (i < result.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    
    return 0;
}`,

      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int cmp(const void* a, const void* b) {
    return (*(int*)a - *(int*)b);
}

int* majorityElement(int* nums, int numsSize, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}

int main() {
    char line[1000000];
    fgets(line, sizeof(line), stdin);
    
    int nums[50000];
    int numsSize = 0;
    char* token = strtok(line, "[,]\\n");
    while (token != NULL) {
        nums[numsSize++] = atoi(token);
        token = strtok(NULL, "[,]\\n");
    }
    
    int returnSize;
    int* result = majorityElement(nums, numsSize, &returnSize);
    qsort(result, returnSize, sizeof(int), cmp);
    
    printf("[");
    for (int i = 0; i < returnSize; i++) {
        printf("%d", result[i]);
        if (i < returnSize - 1) printf(",");
    }
    printf("]\\n");
    
    if (result) free(result);
    return 0;
}`
    },
    hints: [
      "At most 2 elements can appear more than ⌊n/3⌋ times.",
      "Use Boyer-Moore Voting Algorithm extended to 2 candidates.",
      "After finding candidates, verify by counting their occurrences."
    ],
    tags: ["Array", "Hash Table", "Sorting", "Counting"],
    timeLimit: 30,
    memoryLimit: 128,
    isActive: true,
    isContestOnly: true
  },

  // ==================== KTH LARGEST ELEMENT ====================
  {
    title: "Kth Largest Element in an Array",
    description: `Given an integer array \`nums\` and an integer \`k\`, return the kth largest element in the array.

Note that it is the kth largest element in the sorted order, not the kth distinct element.

Can you solve it without sorting?`,
    difficulty: "Medium",
    constraints: `• 1 <= k <= nums.length <= 10^5
• -10^4 <= nums[i] <= 10^4`,
    examples: [
      {
        input: "nums = [3,2,1,5,6,4], k = 2",
        output: "5",
        explanation: "The 2nd largest element is 5."
      },
      {
        input: "nums = [3,2,3,1,2,4,5,5,6], k = 4",
        output: "4",
        explanation: "The 4th largest element is 4."
      }
    ],
    testCases: [
      { input: "[3,2,1,5,6,4]\n2", expectedOutput: "5", isHidden: false },
      { input: "[3,2,3,1,2,4,5,5,6]\n4", expectedOutput: "4", isHidden: false },
      { input: "[1]\n1", expectedOutput: "1", isHidden: false },
      { input: "[2,1]\n1", expectedOutput: "2", isHidden: true },
      { input: "[2,1]\n2", expectedOutput: "1", isHidden: true },
      { input: "[7,6,5,4,3,2,1]\n3", expectedOutput: "5", isHidden: true },
      { input: "[-1,-1]\n2", expectedOutput: "-1", isHidden: true },
      { input: "[5,5,5,5,5]\n3", expectedOutput: "5", isHidden: true },
      // Large: sorted ascending, find middle (n=100000)
      { input: generateLargeArray(100000, i => i) + "\n50000", expectedOutput: "50000", isHidden: true },
      // Large: sorted descending (n=80000)
      { input: generateLargeArray(80000, i => 80000 - i) + "\n1", expectedOutput: "80000", isHidden: true },
      // Large: all same (n=60000)
      { input: generateLargeArray(60000, () => 42) + "\n30000", expectedOutput: "42", isHidden: true },
    ],
    functionSignatures: {
      javascript: `function findKthLargest(nums, k) {
    // Your code here
}`,
      python: `def find_kth_largest(nums, k):
    # Your code here
    pass`,
      java: `class Solution {
    public int findKthLargest(int[] nums, int k) {
        // Your code here
        return 0;
    }
}`,
      cpp: `class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        // Your code here
        return 0;
    }
};`,
      c: `int findKthLargest(int* nums, int numsSize, int k) {
    // Your code here
    return 0;
}`
    },
    languageBoilerplate: {
      javascript: `function findKthLargest(nums, k) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
const nums = input[0].replace(/[\\[\\]]/g, '').split(',').filter(x => x).map(x => parseInt(x));
const k = parseInt(input[1]);
const result = findKthLargest(nums, k);
console.log(result);`,

      python: `def find_kth_largest(nums, k):
    # Your code here
    pass

# Driver code
import sys
import re
input_lines = sys.stdin.read().strip().split('\\n')
nums_str = re.sub(r'[\\[\\]]', '', input_lines[0])
nums = [int(x) for x in nums_str.split(',') if x]
k = int(input_lines[1])
result = find_kth_largest(nums, k)
print(result)`,

      java: `import java.util.*;
import java.io.*;

public class Solution {
    public int findKthLargest(int[] nums, int k) {
        // Your code here
        return 0;
    }
    
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine().replace("[", "").replace("]", "");
        String[] parts = line.split(",");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i].trim());
        }
        int k = Integer.parseInt(br.readLine().trim());
        
        Solution sol = new Solution();
        int result = sol.findKthLargest(nums, k);
        System.out.println(result);
    }
}`,

      cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        // Your code here
        return 0;
    }
};

int main() {
    string line;
    getline(cin, line);
    
    vector<int> nums;
    line = line.substr(1, line.length() - 2);
    stringstream ss(line);
    string num;
    while (getline(ss, num, ',')) {
        nums.push_back(stoi(num));
    }
    
    int k;
    cin >> k;
    
    Solution sol;
    int result = sol.findKthLargest(nums, k);
    cout << result << endl;
    
    return 0;
}`,

      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int findKthLargest(int* nums, int numsSize, int k) {
    // Your code here
    return 0;
}

int main() {
    char line[2000000];
    fgets(line, sizeof(line), stdin);
    
    int nums[100000];
    int numsSize = 0;
    char* token = strtok(line, "[,]\\n");
    while (token != NULL) {
        nums[numsSize++] = atoi(token);
        token = strtok(NULL, "[,]\\n");
    }
    
    int k;
    scanf("%d", &k);
    
    int result = findKthLargest(nums, numsSize, k);
    printf("%d\\n", result);
    
    return 0;
}`
    },
    hints: [
      "You can use a min-heap of size k for O(n log k) solution.",
      "QuickSelect algorithm gives O(n) average time complexity.",
      "Sorting works but is O(n log n) which may be slower."
    ],
    tags: ["Array", "Divide and Conquer", "Sorting", "Heap", "Quickselect"],
    timeLimit: 30,
    memoryLimit: 128,
    isActive: true,
    isContestOnly: true
  },

  // ==================== LCA OF BST ====================
  {
    title: "Lowest Common Ancestor of a Binary Search Tree",
    description: `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.

According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow **a node to be a descendant of itself**)."

The BST is given as a level-order traversal array where \`null\` represents missing nodes.`,
    difficulty: "Medium",
    constraints: `• The number of nodes in the tree is in the range [2, 10^5].
• -10^9 <= Node.val <= 10^9
• All Node.val are unique.
• p != q
• p and q will exist in the BST.`,
    examples: [
      {
        input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8",
        output: "6",
        explanation: "The LCA of nodes 2 and 8 is 6."
      },
      {
        input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4",
        output: "2",
        explanation: "The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself."
      },
      {
        input: "root = [2,1], p = 2, q = 1",
        output: "2",
        explanation: "The LCA of nodes 2 and 1 is 2."
      }
    ],
    testCases: [
      { input: "[6,2,8,0,4,7,9,null,null,3,5]\n2\n8", expectedOutput: "6", isHidden: false },
      { input: "[6,2,8,0,4,7,9,null,null,3,5]\n2\n4", expectedOutput: "2", isHidden: false },
      { input: "[2,1]\n2\n1", expectedOutput: "2", isHidden: false },
      { input: "[6,2,8,0,4,7,9,null,null,3,5]\n3\n5", expectedOutput: "4", isHidden: true },
      { input: "[6,2,8,0,4,7,9,null,null,3,5]\n0\n5", expectedOutput: "2", isHidden: true },
      { input: "[6,2,8,0,4,7,9,null,null,3,5]\n7\n9", expectedOutput: "8", isHidden: true },
      { input: "[5,3,7,1,4,6,8]\n1\n4", expectedOutput: "3", isHidden: true },
      { input: "[5,3,7,1,4,6,8]\n6\n8", expectedOutput: "7", isHidden: true },
      { input: "[5,3,7,1,4,6,8]\n1\n8", expectedOutput: "5", isHidden: true },
      { input: "[20,10,30,5,15,25,35]\n5\n15", expectedOutput: "10", isHidden: true },
      { input: "[20,10,30,5,15,25,35]\n25\n35", expectedOutput: "30", isHidden: true },
    ],
    functionSignatures: {
      javascript: `function lowestCommonAncestor(root, p, q) {
    // Your code here
}`,
      python: `def lowest_common_ancestor(root, p, q):
    # Your code here
    pass`,
      java: `class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        // Your code here
        return null;
    }
}`,
      cpp: `class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        // Your code here
        return nullptr;
    }
};`,
      c: `struct TreeNode* lowestCommonAncestor(struct TreeNode* root, struct TreeNode* p, struct TreeNode* q) {
    // Your code here
    return NULL;
}`
    },
    languageBoilerplate: {
      javascript: `class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = this.right = null;
    }
}

function lowestCommonAncestor(root, p, q) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
const arrStr = input[0].replace(/[\\[\\]]/g, '').split(',');
const pVal = parseInt(input[1]);
const qVal = parseInt(input[2]);

function buildTree(arr) {
    if (!arr.length || arr[0] === 'null') return null;
    const root = new TreeNode(parseInt(arr[0]));
    const queue = [root];
    let i = 1;
    while (i < arr.length) {
        const node = queue.shift();
        if (i < arr.length && arr[i] !== 'null') {
            node.left = new TreeNode(parseInt(arr[i]));
            queue.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== 'null') {
            node.right = new TreeNode(parseInt(arr[i]));
            queue.push(node.right);
        }
        i++;
    }
    return root;
}

function findNode(root, val) {
    if (!root) return null;
    if (root.val === val) return root;
    return findNode(root.left, val) || findNode(root.right, val);
}

const root = buildTree(arrStr);
const p = findNode(root, pVal);
const q = findNode(root, qVal);
const result = lowestCommonAncestor(root, p, q);
console.log(result.val);`,

      python: `class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def lowest_common_ancestor(root, p, q):
    # Your code here
    pass

# Driver code
import sys
import re

def build_tree(arr):
    if not arr or arr[0] == 'null':
        return None
    root = TreeNode(int(arr[0]))
    queue = [root]
    i = 1
    while i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] != 'null':
            node.left = TreeNode(int(arr[i]))
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] != 'null':
            node.right = TreeNode(int(arr[i]))
            queue.append(node.right)
        i += 1
    return root

def find_node(root, val):
    if not root:
        return None
    if root.val == val:
        return root
    return find_node(root.left, val) or find_node(root.right, val)

input_lines = sys.stdin.read().strip().split('\\n')
arr_str = re.sub(r'[\\[\\]]', '', input_lines[0]).split(',')
p_val = int(input_lines[1])
q_val = int(input_lines[2])

root = build_tree(arr_str)
p = find_node(root, p_val)
q = find_node(root, q_val)
result = lowest_common_ancestor(root, p, q)
print(result.val)`,

      java: `import java.util.*;
import java.io.*;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}

public class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        // Your code here
        return null;
    }
    
    static TreeNode buildTree(String[] arr) {
        if (arr.length == 0 || arr[0].equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(arr[0]));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        int i = 1;
        while (i < arr.length) {
            TreeNode node = queue.poll();
            if (i < arr.length && !arr[i].equals("null")) {
                node.left = new TreeNode(Integer.parseInt(arr[i]));
                queue.offer(node.left);
            }
            i++;
            if (i < arr.length && !arr[i].equals("null")) {
                node.right = new TreeNode(Integer.parseInt(arr[i]));
                queue.offer(node.right);
            }
            i++;
        }
        return root;
    }
    
    static TreeNode findNode(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;
        TreeNode left = findNode(root.left, val);
        if (left != null) return left;
        return findNode(root.right, val);
    }
    
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] arr = br.readLine().replace("[", "").replace("]", "").split(",");
        int pVal = Integer.parseInt(br.readLine().trim());
        int qVal = Integer.parseInt(br.readLine().trim());
        
        TreeNode root = buildTree(arr);
        TreeNode p = findNode(root, pVal);
        TreeNode q = findNode(root, qVal);
        
        Solution sol = new Solution();
        TreeNode result = sol.lowestCommonAncestor(root, p, q);
        System.out.println(result.val);
    }
}`,

      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <queue>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        // Your code here
        return nullptr;
    }
};

TreeNode* buildTree(vector<string>& arr) {
    if (arr.empty() || arr[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(arr[0]));
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (i < arr.size()) {
        TreeNode* node = q.front();
        q.pop();
        if (i < arr.size() && arr[i] != "null") {
            node->left = new TreeNode(stoi(arr[i]));
            q.push(node->left);
        }
        i++;
        if (i < arr.size() && arr[i] != "null") {
            node->right = new TreeNode(stoi(arr[i]));
            q.push(node->right);
        }
        i++;
    }
    return root;
}

TreeNode* findNode(TreeNode* root, int val) {
    if (!root) return nullptr;
    if (root->val == val) return root;
    TreeNode* left = findNode(root->left, val);
    if (left) return left;
    return findNode(root->right, val);
}

int main() {
    string line;
    getline(cin, line);
    
    vector<string> arr;
    line = line.substr(1, line.length() - 2);
    stringstream ss(line);
    string item;
    while (getline(ss, item, ',')) {
        arr.push_back(item);
    }
    
    int pVal, qVal;
    cin >> pVal >> qVal;
    
    TreeNode* root = buildTree(arr);
    TreeNode* p = findNode(root, pVal);
    TreeNode* q = findNode(root, qVal);
    
    Solution sol;
    TreeNode* result = sol.lowestCommonAncestor(root, p, q);
    if (result) {
        cout << result->val << endl;
    } else {
        cout << "null" << endl;
    }
    
    return 0;
}`,

      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
};

struct TreeNode* lowestCommonAncestor(struct TreeNode* root, struct TreeNode* p, struct TreeNode* q) {
    // Your code here
    return NULL;
}

struct TreeNode* createNode(int val) {
    struct TreeNode* node = (struct TreeNode*)malloc(sizeof(struct TreeNode));
    node->val = val;
    node->left = NULL;
    node->right = NULL;
    return node;
}

struct TreeNode* findNode(struct TreeNode* root, int val) {
    if (!root) return NULL;
    if (root->val == val) return root;
    struct TreeNode* left = findNode(root->left, val);
    if (left) return left;
    return findNode(root->right, val);
}

int main() {
    char line[10000];
    fgets(line, sizeof(line), stdin);
    
    // Parse array values
    int values[1000];
    int isNull[1000];
    int n = 0;
    
    char* token = strtok(line, "[,]\\n");
    while (token != NULL) {
        while (*token == ' ') token++;
        if (strcmp(token, "null") == 0) {
            isNull[n] = 1;
            values[n] = 0;
        } else {
            isNull[n] = 0;
            values[n] = atoi(token);
        }
        n++;
        token = strtok(NULL, "[,]\\n");
    }
    
    int pVal, qVal;
    scanf("%d %d", &pVal, &qVal);
    
    if (n == 0 || isNull[0]) {
        printf("null\\n");
        return 0;
    }
    
    // Build tree using queue
    struct TreeNode* nodes[1000];
    struct TreeNode* root = createNode(values[0]);
    nodes[0] = root;
    int front = 0, back = 1;
    int i = 1;
    
    while (i < n) {
        struct TreeNode* node = nodes[front++];
        if (i < n && !isNull[i]) {
            node->left = createNode(values[i]);
            nodes[back++] = node->left;
        }
        i++;
        if (i < n && !isNull[i]) {
            node->right = createNode(values[i]);
            nodes[back++] = node->right;
        }
        i++;
    }
    
    struct TreeNode* p = findNode(root, pVal);
    struct TreeNode* q = findNode(root, qVal);
    struct TreeNode* result = lowestCommonAncestor(root, p, q);
    if (result) {
        printf("%d\\n", result->val);
    } else {
        printf("null\\n");
    }
    
    return 0;
}`
    },
    hints: [
      "Use the BST property: left subtree has smaller values, right subtree has larger values.",
      "If both p and q are smaller than current node, LCA is in left subtree.",
      "If both p and q are larger than current node, LCA is in right subtree.",
      "Otherwise, current node is the LCA."
    ],
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "Binary Tree"],
    timeLimit: 30,
    memoryLimit: 128,
    isActive: true,
    isContestOnly: true
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-versus');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function addContestProblems() {
  try {
    await connectDB();
    
    console.log('\n🚀 Adding Contest-Only Problems...\n');
    
    let added = 0;
    let updated = 0;
    
    for (const problemData of contestProblems) {
      // Check if problem already exists
      const existingProblem = await Problem.findOne({ title: problemData.title });
      
      if (existingProblem) {
        // Update existing problem
        await Problem.findByIdAndUpdate(existingProblem._id, problemData);
        console.log(`🔄 Updated: "${problemData.title}" (${problemData.difficulty})`);
        console.log(`   📝 Test Cases: ${problemData.testCases.length}`);
        console.log(`   🔒 Contest Only: Yes\n`);
        updated++;
      } else {
        // Create new problem
        const problem = new Problem(problemData);
        await problem.save();
        console.log(`✅ Added: "${problemData.title}" (${problemData.difficulty})`);
        console.log(`   📝 Test Cases: ${problemData.testCases.length}`);
        console.log(`   🔒 Contest Only: Yes\n`);
        added++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Added: ${added} problems`);
    console.log(`   🔄 Updated: ${updated} problems`);
    console.log(`   📝 Total: ${contestProblems.length} problems\n`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error adding problems:', error);
    process.exit(1);
  }
}

// Run the script
addContestProblems();
