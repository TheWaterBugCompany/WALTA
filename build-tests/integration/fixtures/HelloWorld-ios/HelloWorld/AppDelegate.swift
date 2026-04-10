import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        NSLog("App started")
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.backgroundColor = .white

        let vc = UIViewController()
        vc.view.backgroundColor = .white

        let label = UILabel()
        label.text = "Hello World"
        label.accessibilityIdentifier = "greeting"
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(label)

        let button = UIButton(type: .system)
        button.setTitle("Tap Me", for: .normal)
        button.accessibilityIdentifier = "tapButton"
        button.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(button)

        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: vc.view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: vc.view.centerYAnchor, constant: -40),
            button.centerXAnchor.constraint(equalTo: vc.view.centerXAnchor),
            button.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 20),
        ])

        button.addAction(UIAction { _ in
            label.text = "Tapped!"
            NSLog("Button tapped")
        }, for: .touchUpInside)

        window?.rootViewController = vc
        window?.makeKeyAndVisible()
        return true
    }
}
