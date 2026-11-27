import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
    private let label = UILabel()
    private let done = UIButton(type: .system)
    private var started = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        label.text = NSLocalizedString("Receiving audio…", comment: "")
        label.numberOfLines = 0
        label.textAlignment = .center
        done.setTitle(NSLocalizedString("Done", comment: ""), for: .normal)
        done.isEnabled = false
        done.addTarget(self, action: #selector(finish), for: .touchUpInside)
        let stack = UIStackView(arrangedSubviews: [label, done])
        stack.axis = .vertical
        stack.spacing = 24
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24)
        ])
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !started else { return }
        started = true
        let items = extensionContext?.inputItems as? [NSExtensionItem] ?? []
        let providers = items.flatMap { $0.attachments ?? [] }
        guard let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.audio.identifier) }) else {
            complete(NSError(domain: "SharedAudio", code: 1,
                userInfo: [NSLocalizedDescriptionKey: NSLocalizedString("Please select an audio file.", comment: "")]))
            return
        }
        // Copy inside the callback: the provider's temporary file expires on return.
        provider.loadFileRepresentation(forTypeIdentifier: UTType.audio.identifier) { [weak self] url, error in
            do {
                if let error { throw error }
                guard let url else { throw CocoaError(.fileReadUnknown) }
                try SharedAudioInbox.save(url)
                self?.complete(nil)
            } catch { self?.complete(error) }
        }
    }

    private func complete(_ error: Error?) {
        DispatchQueue.main.async {
            self.label.text = error?.localizedDescription
                ?? NSLocalizedString("Audio saved. Open Dialects to continue in Praat.", comment: "")
            self.done.isEnabled = true
        }
    }

    @objc private func finish() {
        extensionContext?.completeRequest(returningItems: nil)
    }
}
