import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import dotenv from 'dotenv';

dotenv.config();

const driverCodeTemplates = {
  "Two Sum": {
    javascript: `function twoSum(nums, target) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
// Parse array more robustly - handle spaces and formatting
const numsStr = input[0].replace(/[\\[\\]\\s]/g, '').split(',').filter(x => x);
const nums = numsStr.map(x => parseInt(x));
const target = parseInt(input[1]);
const result = twoSum(nums, target);
console.log(JSON.stringify(result).replace(/, /g, ','));`,

    python: `def two_sum(nums, target):
    # Your code here
    pass

# Driver code
import sys
import re
input_lines = sys.stdin.read().strip().split('\\n')
# Parse array more robustly - handle spaces and formatting
nums_str = re.sub(r'[\\[\\]\\s]', '', input_lines[0])
nums = [int(x) for x in nums_str.split(',') if x]
target = int(input_lines[1])
result = two_sum(nums, target)
print(str(result).replace(' ', ''))`,

    java: `import java.util.*;
import java.io.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[0];
    }
    
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine().trim();
        // Remove brackets and split
        line = line.replace("[", "").replace("]", "").replace(" ", "");
        String[] numsStr = line.split(",");
        int[] nums = new int[numsStr.length];
        for (int i = 0; i < numsStr.length; i++) {
            nums[i] = Integer.parseInt(numsStr[i].trim());
        }
        int target = Integer.parseInt(br.readLine().trim());
        
        Solution sol = new Solution();
        int[] result = sol.twoSum(nums, target);
        // Output in format [a,b] without spaces
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < result.length; i++) {
            sb.append(result[i]);
            if (i < result.length - 1) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb.toString());
    }
}`,

    cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        return {};
    }
};

int main() {
    string line;
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    line = line.substr(1, line.length() - 2); // Remove [ ]
    stringstream ss(line);
    string num;
    while (getline(ss, num, ',')) {
        nums.push_back(stoi(num));
    }
    
    int target;
    cin >> target;
    
    Solution sol;
    vector<int> result = sol.twoSum(nums, target);
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

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}

int main() {
    char line[1000];
    fgets(line, sizeof(line), stdin);
    
    // Parse array
    int nums[1000];
    int numsSize = 0;
    char* token = strtok(line, "[,]");
    while (token != NULL) {
        if (token[0] >= '0' && token[0] <= '9') {
            nums[numsSize++] = atoi(token);
        }
        token = strtok(NULL, "[,]");
    }
    
    int target;
    scanf("%d", &target);
    
    int returnSize;
    int* result = twoSum(nums, numsSize, target, &returnSize);
    
    printf("[");
    for (int i = 0; i < returnSize; i++) {
        printf("%d", result[i]);
        if (i < returnSize - 1) printf(",");
    }
    printf("]\\n");
    
    free(result);
    return 0;
}`
  },

  "Reverse String": {
    javascript: `function reverseString(s) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim();
// Parse JSON array properly
const s = JSON.parse(input);
const original = [...s];
const result = reverseString(s);
// Handle both in-place modification and return value
const output = result !== undefined ? result : s;
console.log(JSON.stringify(output).replace(/, /g, ','));`,

    python: `def reverse_string(s):
    # Your code here
    pass

# Driver code
import sys
import json
input_str = sys.stdin.read().strip()
# Parse JSON array properly
s = json.loads(input_str)
original = s[:]
result = reverse_string(s)
# Handle both in-place modification and return value
output = result if result is not None else s
print(json.dumps(output, separators=(',', ':')))`,

    java: `import java.util.*;
import java.io.*;

public class Solution {
    public void reverseString(char[] s) {
        // Your code here
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        String[] chars = input.replace("[", "").replace("]", "").replace("\"", "").split(",");
        char[] s = new char[chars.length];
        for (int i = 0; i < chars.length; i++) {
            s[i] = chars[i].trim().charAt(0);
        }

        Solution sol = new Solution();
        sol.reverseString(s);

        System.out.print("[");
        for (int i = 0; i < s.length; i++) {
            System.out.print("\"" + s[i] + "\"");
            if (i < s.length - 1) System.out.print(",");
        }
        System.out.println("]");
    }
}`,

    cpp: `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    void reverseString(vector<char>& s) {
        // Your code here
    }
};

int main() {
    string line;
    getline(cin, line);

    vector<char> s;
    for (int i = 0; i < line.length(); i++) {
        if (line[i] >= 'a' && line[i] <= 'z') {
            s.push_back(line[i]);
        }
    }

    Solution sol;
    sol.reverseString(s);

    cout << "[";
    for (int i = 0; i < s.size(); i++) {
        cout << "\"" << s[i] << "\"";
        if (i < s.size() - 1) cout << ",";
    }
    cout << "]" << endl;

    return 0;
}`,

    c: `#include <stdio.h>
#include <string.h>

void reverseString(char* s, int sSize) {
    // Your code here
}

int main() {
    char input[1000];
    fgets(input, sizeof(input), stdin);

    char s[100];
    int sSize = 0;
    for (int i = 0; i < strlen(input); i++) {
        if (input[i] >= 'a' && input[i] <= 'z') {
            s[sSize++] = input[i];
        }
    }

    reverseString(s, sSize);

    printf("[");
    for (int i = 0; i < sSize; i++) {
        printf("\"%c\"", s[i]);
        if (i < sSize - 1) printf(",");
    }
    printf("]\\n");

    return 0;
}`
  },

  "Valid Parentheses": {
    javascript: `function isValid(s) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim();
// Parse JSON string (remove outer quotes)
const s = JSON.parse(input);
const result = isValid(s);
console.log(result);`,

    python: `def is_valid(s):
    # Your code here
    pass

# Driver code
import sys
import json
input_str = sys.stdin.read().strip()
# Parse JSON string (remove outer quotes)
s = json.loads(input_str)
result = is_valid(s)
print('true' if result else 'false')`,

    java: `import java.util.*;
import java.io.*;

public class Solution {
    public boolean isValid(String s) {
        // Your code here
        return false;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();

        Solution sol = new Solution();
        boolean result = sol.isValid(s);
        System.out.println(result);
    }
}`,

    cpp: `#include <iostream>
#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Your code here
        return false;
    }
};

int main() {
    string s;
    getline(cin, s);

    Solution sol;
    bool result = sol.isValid(s);
    cout << (result ? "true" : "false") << endl;

    return 0;
}`,

    c: `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool isValid(char* s) {
    // Your code here
    return false;
}

int main() {
    char s[10000];
    fgets(s, sizeof(s), stdin);

    // Remove newline
    int len = strlen(s);
    if (len > 0 && s[len-1] == '\\n') {
        s[len-1] = '\\0';
    }

    bool result = isValid(s);
    printf("%s\\n", result ? "true" : "false");

    return 0;
}`
  },

  "Factorial": {
    javascript: `function factorial(n) {
    // Your code here
}

// Driver code
const input = require('fs').readFileSync(0, 'utf8').trim();
const n = parseInt(input);
const result = factorial(n);
console.log(result);`,

    python: `def factorial(n):
    # Your code here
    pass

# Driver code
import sys
n = int(sys.stdin.read().strip())
result = factorial(n)
print(result)`,

    java: `import java.util.*;
import java.io.*;

public class Solution {
    public int factorial(int n) {
        // Your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine());

        Solution sol = new Solution();
        int result = sol.factorial(n);
        System.out.println(result);
    }
}`,

    cpp: `#include <iostream>
using namespace std;

class Solution {
public:
    int factorial(int n) {
        // Your code here
        return 0;
    }
};

int main() {
    int n;
    cin >> n;

    Solution sol;
    int result = sol.factorial(n);
    cout << result << endl;

    return 0;
}`,

    c: `#include <stdio.h>

int factorial(int n) {
    // Your code here
    return 0;
}

int main() {
    int n;
    scanf("%d", &n);

    int result = factorial(n);
    printf("%d\\n", result);

    return 0;
}`
  }
};

async function addDriverCode() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const problems = await Problem.find({});
    console.log(`Found ${problems.length} problems`);

    for (const problem of problems) {
      const templates = driverCodeTemplates[problem.title];
      if (templates) {
        problem.languageBoilerplate = templates;
        // Also update functionSignatures to be minimal
        problem.functionSignatures = {
          javascript: templates.javascript.split('// Driver code')[0].trim(),
          python: templates.python.split('# Driver code')[0].trim(),
          java: templates.java.split('public static void main')[0].trim() + '}',
          cpp: templates.cpp.split('int main()')[0].trim() + '};',
          c: templates.c.split('int main()')[0].trim()
        };
        await problem.save();
        console.log(`Updated driver code for: ${problem.title}`);
      } else {
        console.log(`No driver code found for: ${problem.title}`);
      }
    }

    console.log('Driver code update completed');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating driver code:', error);
    process.exit(1);
  }
}

addDriverCode();
