#include <iostream>
#include <string>
using namespace std;

class User
{
private:
    string username, password;

public:
    void registerUser()
    {
        cout << "\n----- REGISTER -----\n";

        cout << "Enter Username: ";
        cin >> username;

        cout << "Enter Password: ";
        cin >> password;

        cout << "\nRegistration Successful!\n";
    }

    bool loginUser()
    {
        string u, p;

        cout << "\n----- LOGIN -----\n";

        cout << "Enter Username: ";
        cin >> u;

        cout << "Enter Password: ";
        cin >> p;

        if (username.empty())
        {
            cout << "\nUser Not Found! Please Register First.\n";
            return false;
        }

        if (u == username && p == password)
        {
            cout << "\nLogin Successful!\n";
            return true;
        }

        cout << "\nInvalid Username or Password!\n";
        return false;
    }
};

class FitnessTracker
{
private:
    int age;
    float height, weight, bmi;

public:
    void getData()
    {
        cout << "\nEnter Age: ";
        cin >> age;

        cout << "Enter Height (meters): ";
        cin >> height;

        cout << "Enter Weight (kg): ";
        cin >> weight;
    }

    void calculateBMI()
    {
        bmi = weight / (height * height);
    }

    void showBMI()
    {
        cout << "\nBMI = " << bmi << endl;

        if (bmi < 18.5)
            cout << "Category: Underweight\n";
        else if (bmi < 25)
            cout << "Category: Normal\n";
        else if (bmi < 30)
            cout << "Category: Overweight\n";
        else
            cout << "Category: Obese\n";
    }
};

int main()
{
    User user;
    FitnessTracker ft;
    int choice;

    do
    {
        cout << "\n===== WELCOME TO FITNESS TRACKER =====\n";
        cout << "1. Register\n";
        cout << "2. Login\n";
        cout << "3. Exit\n";
        cout << "Enter Choice: ";
        cin >> choice;

        switch(choice)
        {
            case 1:
                user.registerUser();
                break;

            case 2:
                if(user.loginUser())
                {
                    ft.getData();
                    ft.calculateBMI();
                    ft.showBMI();
                }
                break;

            case 3:
                cout << "Thank You!\n";
                break;

            default:
                cout << "Invalid Choice!\n";
        }

    } while(choice != 3);

    return 0;
}
