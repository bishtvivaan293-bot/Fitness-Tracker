#include <iostream>
#include <string>
#include <fstream>
#include <limits>
#include <stack>
#include <queue>
using namespace std;

class User {
    string username, password;
public:
    void registerUser() {
        cout << "\n----- REGISTER -----\nEnter Username: ";
        cin >> username;
        cout << "Enter Password: ";
        cin >> password;
        cout << "Registration successful for this session!\n";
    }
    bool loginUser() {
        string u, p;
        cout << "\n----- LOGIN -----\nEnter Username: ";
        cin >> u;
        cout << "Enter Password: ";
        cin >> p;
        if (username.empty()) { cout << "Please register first in this session.\n"; return false; }
        if (u == username && p == password) { cout << "Login successful!\n"; return true; }
        cout << "Invalid username or password!\n";
        return false;
    }
};

struct Workout {
    int id, duration;
    string name;
    float calories;
    Workout* next;
    Workout(int i, string n, int d, float c)
        : id(i), duration(d), name(n), calories(c), next(nullptr) {}
};

class FitnessTracker {
    string name, gender, goal;
    int age = 0;
    float height = 0, weight = 0, bmi = 0;
    Workout* head = nullptr;
    stack<int> undoStack;   // LIFO: undo most recently added workout
    queue<int> workoutQueue; // FIFO: process oldest queued workout first
    const string filename = "workouts.txt";

    void clearWorkouts() {
        while (head) { Workout* t = head; head = head->next; delete t; }
    }
    Workout* findByID(int id) {
        Workout* p = head;
        while (p) { if (p->id == id) return p; p = p->next; }
        return nullptr;
    }
    int nextID() {
        int largest = 0;
        for (Workout* p = head; p; p = p->next)
            if (p->id > largest) largest = p->id;
        return largest + 1;
    }
public:
    ~FitnessTracker() { saveWorkouts(); clearWorkouts(); }

    void getData() {
        int choice;
        cout << "\n===== SELECT GOAL =====\n1. Bulk\n2. Cut\n3. Maintain\nEnter Choice: ";
        cin >> choice;
        goal = (choice == 1) ? "Bulk" : (choice == 2) ? "Cut" : "Maintain";
        cout << "Enter Name: "; cin >> name;
        cout << "Enter Age: "; cin >> age;
        cout << "Enter Gender: "; cin >> gender;
        cout << "Enter Height (meters): "; cin >> height;
        cout << "Enter Weight (kg): "; cin >> weight;
        loadWorkouts();
    }
    void calculateBMI() {
        if (height <= 0 || weight <= 0) { cout << "Height and weight must be greater than zero.\n"; return; }
        bmi = weight / (height * height);
        cout << "\nBMI = " << bmi << '\n';
        if (bmi < 18.5) cout << "Category: Underweight\n";
        else if (bmi < 25) cout << "Category: Normal\n";
        else if (bmi < 30) cout << "Category: Overweight\n";
        else cout << "Category: Obese\n";
    }
    void dailyCalories() {
        if (weight <= 0) { cout << "Please enter a valid weight first.\n"; return; }
        float maintain = weight * 33;
        cout << "\n===== DAILY CALORIES (ESTIMATE) =====\n";
        if (goal == "Bulk") cout << "Recommended Calories = " << maintain + 300 << " Calories/day\n";
        else if (goal == "Cut") cout << "Recommended Calories = " << maintain - 300 << " Calories/day\n";
        else cout << "Recommended Calories = " << maintain << " Calories/day\n";
    }
    float estimateCalories(int option, int minutes) {
        switch (option) {
            case 1: return minutes * 10.0f;
            case 2: return minutes * 8.0f;
            case 3: return minutes * 4.0f;
            case 4: return minutes * 7.0f;
            case 5: return minutes * 8.0f;
            case 6: return minutes * 6.0f;
            case 7: return minutes * 5.0f;
            default: return 0.0f;
        }
    }

    // DSA: Linked List insertion at tail
    void addWorkout() {
        int option, minutes;
        string workoutName;
        cout << "\n===== ADD WORKOUT =====\n1. Running\n2. Cycling\n3. Walking\n4. Pushups\n5. Pullups\n6. Squats\n7. Crunches\nChoose workout: ";
        if (!(cin >> option)) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Invalid input.\n"; return; }
        cout << "Duration (minutes): ";
        if (!(cin >> minutes) || minutes <= 0) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Duration must be positive.\n"; return; }
        switch (option) {
            case 1: workoutName="Running"; break; case 2: workoutName="Cycling"; break;
            case 3: workoutName="Walking"; break; case 4: workoutName="Pushups"; break;
            case 5: workoutName="Pullups"; break; case 6: workoutName="Squats"; break;
            case 7: workoutName="Crunches"; break;
            default: cout << "Invalid workout choice.\n"; return;
        }
        int id = nextID();
        Workout* node = new Workout(id, workoutName, minutes, estimateCalories(option, minutes));
        if (!head) head = node;
        else { Workout* tail = head; while (tail->next) tail = tail->next; tail->next = node; }
        undoStack.push(id);
        workoutQueue.push(id);
        saveWorkouts();
        cout << "Workout added! ID: " << id << ", estimated calories: " << node->calories << '\n';
    }

    // DSA: Linked List traversal
    void viewWorkouts() {
        cout << "\n===== WORKOUT HISTORY =====\n";
        if (!head) { cout << "No workout records found.\n"; return; }
        Workout* p = head;
        while (p) {
            cout << "ID: " << p->id << " | " << p->name << " | Duration: "
                 << p->duration << " minutes | Estimated calories: " << p->calories << '\n';
            p = p->next;
        }
    }

    // DSA: Linear search
    void searchWorkout() {
        if (!head) { cout << "No workout records found.\n"; return; }
        int id;
        cout << "Enter Workout ID to search: ";
        if (!(cin >> id)) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Invalid ID.\n"; return; }
        Workout* p = findByID(id);
        if (p) cout << "Found: ID " << p->id << " | " << p->name << " | "
                    << p->duration << " minutes | " << p->calories << " calories\n";
        else cout << "Workout ID not found.\n";
    }

    // DSA: Linked List deletion by ID
    void deleteWorkout() {
        if (!head) { cout << "No workout records to delete.\n"; return; }
        int id;
        cout << "Enter Workout ID to delete: ";
        if (!(cin >> id)) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Invalid ID.\n"; return; }
        Workout *cur = head, *prev = nullptr;
        while (cur && cur->id != id) { prev = cur; cur = cur->next; }
        if (!cur) { cout << "Workout ID not found.\n"; return; }
        if (!prev) head = cur->next; else prev->next = cur->next;
        delete cur;
        saveWorkouts();
        cout << "Workout deleted.\n";
    }

    // DSA: Bubble sort by duration. Swap data, not next pointers.
    void sortWorkoutsByDuration() {
        if (!head || !head->next) { cout << "Not enough workouts to sort.\n"; return; }
        bool swapped;
        do {
            swapped = false;
            Workout* p = head;
            while (p && p->next) {
                if (p->duration > p->next->duration) {
                    swap(p->id, p->next->id);
                    swap(p->name, p->next->name);
                    swap(p->duration, p->next->duration);
                    swap(p->calories, p->next->calories);
                    swapped = true;
                }
                p = p->next;
            }
        } while (swapped);
        saveWorkouts();
        cout << "Sorted by duration (ascending).\n";
        viewWorkouts();
    }

    // DSA: Stack (LIFO)
    void undoLastWorkout() {
        if (undoStack.empty()) { cout << "Undo history is empty for this session.\n"; return; }
        int id = undoStack.top(); undoStack.pop();
        Workout *cur = head, *prev = nullptr;
        while (cur && cur->id != id) { prev = cur; cur = cur->next; }
        if (!cur) { cout << "That workout is no longer in the list.\n"; return; }
        if (!prev) head = cur->next; else prev->next = cur->next;
        delete cur;
        saveWorkouts();
        cout << "Last added workout undone.\n";
    }

    // DSA: Queue (FIFO)
    void processNextWorkout() {
        while (!workoutQueue.empty() && findByID(workoutQueue.front()) == nullptr)
            workoutQueue.pop();
        if (workoutQueue.empty()) { cout << "Workout queue is empty for this session.\n"; return; }
        int id = workoutQueue.front(); workoutQueue.pop();
        Workout* p = findByID(id);
        if (p) cout << "Processed oldest queued workout: ID " << p->id << " | "
                    << p->name << " | " << p->duration << " minutes\n";
    }

    void saveWorkouts() {
        ofstream file(filename);
        if (!file) { cout << "Warning: could not save workout file.\n"; return; }
        for (Workout* p = head; p; p = p->next)
            file << p->id << ' ' << p->name << ' ' << p->duration << ' ' << p->calories << '\n';
    }
    void loadWorkouts() {
        clearWorkouts();
        ifstream file(filename);
        if (!file) return;
        int id, duration; string workoutName; float calories;
        Workout* tail = nullptr;
        while (file >> id >> workoutName >> duration >> calories) {
            Workout* node = new Workout(id, workoutName, duration, calories);
            if (!head) head = node; else tail->next = node;
            tail = node;
        }
    }

    void dashboard() {
        int choice = 0;
        do {
            cout << "\n===== FITNESS DASHBOARD =====\n"
                 << "1. Calculate BMI\n2. Daily Calories\n3. Add Workout\n"
                 << "4. View Workout History\n5. Search Workout by ID\n"
                 << "6. Delete Workout by ID\n7. Save Workout Records\n"
                 << "8. Sort Workouts by Duration\n9. Undo Last Workout (Stack)\n"
                 << "10. Process Next Workout (Queue)\n11. Exit\nEnter Choice: ";
            if (!(cin >> choice)) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Invalid input.\n"; continue; }
            switch (choice) {
                case 1: calculateBMI(); break;
                case 2: dailyCalories(); break;
                case 3: addWorkout(); break;
                case 4: viewWorkouts(); break;
                case 5: searchWorkout(); break;
                case 6: deleteWorkout(); break;
                case 7: saveWorkouts(); cout << "Workout records saved.\n"; break;
                case 8: sortWorkoutsByDuration(); break;
                case 9: undoLastWorkout(); break;
                case 10: processNextWorkout(); break;
                case 11: saveWorkouts(); cout << "Exiting dashboard...\n"; break;
                default: cout << "Invalid choice.\n";
            }
        } while (choice != 11);
    }
};

int main() {
    User user;
    FitnessTracker tracker;
    int choice;
    do {
        cout << "\n===== WELCOME TO FITNESS TRACKER =====\n1. Register\n2. Login\n3. Exit\nEnter Choice: ";
        if (!(cin >> choice)) { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); cout << "Invalid input.\n"; continue; }
        switch (choice) {
            case 1: user.registerUser(); break;
            case 2: if (user.loginUser()) { tracker.getData(); tracker.dashboard(); } break;
            case 3: cout << "Thank you!\n"; break;
            default: cout << "Invalid choice!\n";
        }
    } while (choice != 3);
    return 0;
}
