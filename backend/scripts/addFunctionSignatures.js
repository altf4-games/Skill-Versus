import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import dotenv from 'dotenv';

dotenv.config();

const functionSignatures = {
  "Two Sum": {
    javascript: `function twoSum(nums, target) {
    // Given an array of integers nums and an integer target,
    // return indices of the two numbers such that they add up to target.

    // Example: nums = [2,7,11,15], target = 9
    // Output: [0,1] because nums[0] + nums[1] = 2 + 7 = 9

    // Your solution here

}`,
    python: `def two_sum(nums, target):
    # Given an array of integers nums and an integer target,
    # return indices of the two numbers such that they add up to target.

    # Example: nums = [2,7,11,15], target = 9
    # Output: [0,1] because nums[0] + nums[1] = 2 + 7 = 9

    # Your solution here
    pass`,
    java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Given an array of integers nums and an integer target,
        // return indices of the two numbers such that they add up to target.

        // Example: nums = [2,7,11,15], target = 9
        // Output: [0,1] because nums[0] + nums[1] = 2 + 7 = 9

        // Your solution here

    }
}`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Given an array of integers nums and an integer target,
        // return indices of the two numbers such that they add up to target.

        // Example: nums = [2,7,11,15], target = 9
        // Output: [0,1] because nums[0] + nums[1] = 2 + 7 = 9

        // Your solution here

    }
};`,
    c: `#include <stdio.h>
#include <stdlib.h>

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Given an array of integers nums and an integer target,
    // return indices of the two numbers such that they add up to target.

    // Example: nums = [2,7,11,15], target = 9
    // Output: [0,1] because nums[0] + nums[1] = 2 + 7 = 9

    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));

    // Your solution here

    return result;
}`
  },
  "Reverse String": {
    javascript: `function reverseString(s) {
    // Write a function that reverses a string.
    // The input string is given as an array of characters s.
    // You must do this by modifying the input array in-place.

    // Example: s = ["h","e","l","l","o"]
    // Output: ["o","l","l","e","h"]

    // Your solution here

}`,
    python: `def reverse_string(s):
    # Write a function that reverses a string.
    # The input string is given as an array of characters s.
    # You must do this by modifying the input array in-place.

    # Example: s = ["h","e","l","l","o"]
    # Output: ["o","l","l","e","h"]

    # Your solution here
    pass`,
    java: `public class Solution {
    public void reverseString(char[] s) {
        // Write a function that reverses a string.
        // The input string is given as an array of characters s.
        // You must do this by modifying the input array in-place.

        // Example: s = ["h","e","l","l","o"]
        // Output: ["o","l","l","e","h"]

        // Your solution here

    }
}`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    void reverseString(vector<char>& s) {
        // Write a function that reverses a string.
        // The input string is given as an array of characters s.
        // You must do this by modifying the input array in-place.

        // Example: s = ["h","e","l","l","o"]
        // Output: ["o","l","l","e","h"]

        // Your solution here

    }
};`,
    c: `#include <stdio.h>

void reverseString(char* s, int sSize) {
    // Write a function that reverses a string.
    // The input string is given as an array of characters s.
    // You must do this by modifying the input array in-place.

    // Example: s = ["h","e","l","l","o"]
    // Output: ["o","l","l","e","h"]

    // Your solution here

}`
  },
  "Valid Parentheses": {
    javascript: `function isValid(s) {
    // Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
    // determine if the input string is valid.
    // Valid means: open brackets are closed by the same type in correct order.

    // Example: s = "()" returns true
    // Example: s = "()[]{}" returns true
    // Example: s = "(]" returns false

    // Your solution here

}`,
    python: `def is_valid(s):
    # Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
    # determine if the input string is valid.
    # Valid means: open brackets are closed by the same type in correct order.

    # Example: s = "()" returns True
    # Example: s = "()[]{}" returns True
    # Example: s = "(]" returns False

    # Your solution here
    pass`,
    java: `public class Solution {
    public boolean isValid(String s) {
        // Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
        // determine if the input string is valid.
        // Valid means: open brackets are closed by the same type in correct order.

        // Example: s = "()" returns true
        // Example: s = "()[]{}" returns true
        // Example: s = "(]" returns false

        // Your solution here

    }
}`,
    cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
        // determine if the input string is valid.
        // Valid means: open brackets are closed by the same type in correct order.

        // Example: s = "()" returns true
        // Example: s = "()[]{}" returns true
        // Example: s = "(]" returns false

        // Your solution here

    }
};`,
    c: `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool isValid(char* s) {
    // Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
    // determine if the input string is valid.
    // Valid means: open brackets are closed by the same type in correct order.

    // Example: s = "()" returns true
    // Example: s = "()[]{}" returns true
    // Example: s = "(]" returns false

    // Your solution here

}`
  },
  "Factorial": {
    javascript: `function factorial(n) {
    // Given a non-negative integer n, return the factorial of n.
    // The factorial of n (n!) is the product of all positive integers <= n.
    // By definition, 0! = 1.

    // Example: n = 5 returns 120 (5! = 5 * 4 * 3 * 2 * 1)
    // Example: n = 0 returns 1 (0! = 1 by definition)

    // Your solution here

}`,
    python: `def factorial(n):
    # Given a non-negative integer n, return the factorial of n.
    # The factorial of n (n!) is the product of all positive integers <= n.
    # By definition, 0! = 1.

    # Example: n = 5 returns 120 (5! = 5 * 4 * 3 * 2 * 1)
    # Example: n = 0 returns 1 (0! = 1 by definition)

    # Your solution here
    pass`,
    java: `public class Solution {
    public int factorial(int n) {
        // Given a non-negative integer n, return the factorial of n.
        // The factorial of n (n!) is the product of all positive integers <= n.
        // By definition, 0! = 1.

        // Example: n = 5 returns 120 (5! = 5 * 4 * 3 * 2 * 1)
        // Example: n = 0 returns 1 (0! = 1 by definition)

        // Your solution here

    }
}`,
    cpp: `#include <iostream>
using namespace std;

class Solution {
public:
    int factorial(int n) {
        // Given a non-negative integer n, return the factorial of n.
        // The factorial of n (n!) is the product of all positive integers <= n.
        // By definition, 0! = 1.

        // Example: n = 5 returns 120 (5! = 5 * 4 * 3 * 2 * 1)
        // Example: n = 0 returns 1 (0! = 1 by definition)

        // Your solution here

    }
};`,
    c: `#include <stdio.h>

int factorial(int n) {
    // Given a non-negative integer n, return the factorial of n.
    // The factorial of n (n!) is the product of all positive integers <= n.
    // By definition, 0! = 1.

    // Example: n = 5 returns 120 (5! = 5 * 4 * 3 * 2 * 1)
    // Example: n = 0 returns 1 (0! = 1 by definition)

    // Your solution here

}`
  }
};

async function updateFunctionSignatures() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const problems = await Problem.find({});
    console.log(`Found ${problems.length} problems`);

    for (const problem of problems) {
      const signatures = functionSignatures[problem.title];
      if (signatures) {
        problem.functionSignatures = signatures;
        await problem.save();
        console.log(`Updated function signatures for: ${problem.title}`);
      } else {
        console.log(`No signatures found for: ${problem.title}`);
      }
    }

    console.log('Function signatures update completed');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating function signatures:', error);
    process.exit(1);
  }
}

updateFunctionSignatures();
