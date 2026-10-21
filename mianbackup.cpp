#include <iostream>
#include <string>
#include <fstream>
#include <limits>
using namespace std;

// ---------------- USER AUTHENTICATION ----------------
class User {
private:
    string username, password;

public:
    void registerUser() {
        cout << "\n----- REGISTER -----\n";
        cout << "Enter Username: ";
        cin >> username;
        cout << "Enter Password: ";
        cin >> password;
        cout << "\nRegistration successful for this session!\n";
    }

    bool loginUser() {
        string u, p;
        cout << "\n----- LOGIN -----\n";
        cout << "Enter Username: ";
        cin >> u;
        cout << "Enter Password: ";
        cin >> p;

        if (username.empty()) {
            cout << "\nPlease register first in this session.\n";
            return false;
        }

        if (u == username && p == password) {
            cout << "\nLogin successful!\n";
            return true;
        }

        cout << "\nInvalid username or password!\n";
        return false;
    }
};

// ---------------- WORKOUT LINKED LIST ----------------
struct Workout {
    string name;
    int duration;
    float calories;
    Workout* next;

    Workout(string n, int d, float c)
        : name(n), duration(d), calories(c), next(nullptr) {}
};

class FitnessTracker {
private:
    string name, gender, goal;
    int age = 0;
    float height = 0, weight = 0, bmi = 0;
    Workout* head = nullptr;

    const string filename = "workouts.txt";

    void clearWorkouts() {
        while (head != nullptr) {
            Workout* temp = head;
            head = head->next;
            delete temp;
        }
    }

public:
    ~FitnessTracker() {
        saveWorkouts();
        clearWorkouts();
    }

    void getData() {
        int choice;
        cout << "\n===== SELECT GOAL =====\n";
        cout << "1. Bulk\n2. Cut\n3. Maintain\n";
        cout << "Enter Choice: ";
        cin >> choice;

        if (choice == 1) goal = "Bulk";
        else if (choice == 2) goal = "Cut";
        else goal = "Maintain";

        cout << "Enter Name: ";
        cin >> name;
        cout << "Enter Age: ";
        cin >> age;
        cout << "Enter Gender: ";
        cin >> gender;
        cout << "Enter Height (meters): ";
        cin >> height;
        cout << "Enter Weight (kg): ";
        cin >> weight;

        loadWorkouts();
    }

    void calculateBMI() {
        if (height <= 0) {
            cout << "Height must be greater than zero.\n";
            return;
        }

        bmi = weight / (height * height);
        cout << "\nBMI = " << bmi << '\n';

        if (bmi < 18.5) cout << "Category: Underweight\n";
        else if (bmi < 25) cout << "Category: Normal\n";
        else if (bmi < 30) cout << "Category: Overweight\n";
        else cout << "Category: Obese\n";
    }

    void dailyCalories() {
        if (weight <= 0) {
            cout << "Please enter a valid weight first.\n";
            return;
        }

        float maintain = weight * 33;
        cout << "\n===== DAILY CALORIES (ESTIMATE) =====\n";
        if (goal == "Bulk")
            cout << "Recommended Calories = " << maintain + 300 << " Calories/day\n";
        else if (goal == "Cut")
            cout << "Recommended Calories = " << maintain - 300 << " Calories/day\n";
        else
            cout << "Recommended Calories = " << maintain << " Calories/day\n";
    }

    float estimateCalories(int option, int minutes) {
        switch (option) {
            case 1: return minutes * 10.0f; // Running
            case 2: return minutes * 8.0f;  // Cycling
            case 3: return minutes * 4.0f;  // Walking
            case 4: return minutes * 7.0f;  // Pushups
            case 5: return minutes * 8.0f;  // Pullups
            case 6: return minutes * 6.0f;  // Squats
            case 7: return minutes * 5.0f;  // Crunches
            default: return -1.0f;
        }
    }

    void addWorkout() {
        int option, minutes;
        string workoutName;

        cout << "\n===== ADD WORKOUT =====\n";
        cout << "1. Running\n2. Cycling\n3. Walking\n4. Pushups\n";
        cout << "5. Pullups\n6. Squats\n7. Crunches\n";
        cout << "Choose workout: ";
        cin >> option;
        cout << "Duration (minutes): ";
        cin >> minutes;

        if (minutes <= 0) {
            cout << "Duration must be greater than zero.\n";
            return;
        }

        switch (option) {
            case 1: workoutName = "Running"; break;
            case 2: workoutName = "Cycling"; break;
            case 3: workoutName = "Walking"; break;
            case 4: workoutName = "Pushups"; break;
            case 5: workoutName = "Pullups"; break;
            case 6: workoutName = "Squats"; break;
            case 7: workoutName = "Crunches"; break;
            default:
                cout << "Invalid workout choice.\n";
                return;
        }

        float calories = estimateCalories(option, minutes);
        Workout* newNode = new Workout(workoutName, minutes, calories);

        if (head == nullptr) {
            head = newNode;
        } else {
            Workout* temp = head;
            while (temp->next != nullptr)
                temp = temp->next;
            temp->next = newNode;
        }

        saveWorkouts();
        cout << "Workout added successfully!\n";
        cout << "Estimated calories burnt: " << calories << '\n';
    }

    void viewWorkouts() {
        cout << "\n===== WORKOUT HISTORY =====\n";
        if (head == nullptr) {
            cout << "No workout records found.\n";
            return;
        }

        Workout* temp = head;
        int count = 1;
        while (temp != nullptr) {
            cout << count++ << ". " << temp->name
                 << " | Duration: " << temp->duration << " minutes"
                 << " | Estimated calories: " << temp->calories << '\n';
            temp = temp->next;
        }
    }

    void searchWorkout() {
        string target;
        cout << "Enter exact workout name to search (e.g. Running): ";
        cin >> target;

        Workout* temp = head;
        int position = 1;
        bool found = false;

        while (temp != nullptr) {
            if (temp->name == target) {
                cout << "Found at record " << position << ": "
                     << temp->name << ", " << temp->duration
                     << " minutes, " << temp->calories
                     << " estimated calories.\n";
                found = true;
            }
            temp = temp->next;
            position++;
        }

        if (!found)
            cout << "Workout not found.\n";
    }

    void deleteWorkout() {
        if (head == nullptr) {
            cout << "No workout records to delete.\n";
            return;
        }

        string target;
        cout << "Enter exact workout name to delete: ";
        cin >> target;

        Workout* current = head;
        Workout* previous = nullptr;

        while (current != nullptr && current->name != target) {
            previous = current;
            current = current->next;
        }

        if (current == nullptr) {
            cout << "Workout not found.\n";
            return;
        }

        if (previous == nullptr)
            head = current->next;
        else
            previous->next = current->next;

        delete current;
        saveWorkouts();
        cout << "First matching workout record deleted.\n";
    }

    void saveWorkouts() {
        ofstream file(filename);
        if (!file) {
            cout << "Warning: could not save workout file.\n";
            return;
        }

        Workout* temp = head;
        while (temp != nullptr) {
            file << temp->name << ' '
                 << temp->duration << ' '
                 << temp->calories << '\n';
            temp = temp->next;
        }
    }

    void loadWorkouts() {
        clearWorkouts();
        ifstream file(filename);
        if (!file) return;

        string workoutName;
        int duration;
        float calories;

        while (file >> workoutName >> duration >> calories) {
            Workout* newNode = new Workout(workoutName, duration, calories);
            if (head == nullptr) {
                head = newNode;
            } else {
                Workout* temp = head;
                while (temp->next != nullptr)
                    temp = temp->next;
                temp->next = newNode;
            }
        }
    }

    void dashboard() {
        int choice;
        do {
            cout << "\n===== FITNESS DASHBOARD =====\n";
            cout << "1. Calculate BMI\n";
            cout << "2. Daily Calories\n";
            cout << "3. Add Workout\n";
            cout << "4. View Workout History\n";
            cout << "5. Search Workout\n";
            cout << "6. Delete Workout\n";
            cout << "7. Save Workout Records\n";
            cout << "8. Exit\n";
            cout << "Enter Choice: ";
            cin >> choice;

            switch (choice) {
                case 1: calculateBMI(); break;
                case 2: dailyCalories(); break;
                case 3: addWorkout(); break;
                case 4: viewWorkouts(); break;
                case 5: searchWorkout(); break;
                case 6: deleteWorkout(); break;
                case 7:
                    saveWorkouts();
                    cout << "Workout records saved.\n";
                    break;
                case 8:
                    saveWorkouts();
                    cout << "Exiting dashboard...\n";
                    break;
                default:
                    cout << "Invalid choice.\n";
            }
        } while (choice != 8);
    }
};

int main() {
    User user;
    FitnessTracker tracker;
    int choice;

    do {
        cout << "\n===== WELCOME TO FITNESS TRACKER =====\n";
        cout << "1. Register\n2. Login\n3. Exit\n";
        cout << "Enter Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                user.registerUser();
                break;
            case 2:
                if (user.loginUser()) {
                    tracker.getData();
                    tracker.dashboard();
                }
                break;
            case 3:
                cout << "Thank you!\n";
                break;
            default:
                cout << "Invalid choice!\n";
        }
    } while (choice != 3);

    return 0;
}
