// Loaded only when the user connects a device. No test writes or legacy migration guesses.
export async function createFirebaseTransport(code) {
  // The web API key is a public Firebase app identifier, configured per device.
  // No private pairing code or personal ledger is stored in the repo.
  const apiKey = (localStorage.getItem('findom.firebase.webApiKey.v1') || '').trim();
  if (!/^AIza[0-9A-Za-z_-]{30,}$/.test(apiKey))
    throw new Error('Firebase não configurado. Abra Configurações → Carteira compartilhada e informe a chave apiKey do aplicativo Web no Firebase.');
  const [{ initializeApp, getApps }, { getFirestore, doc, onSnapshot, runTransaction, serverTimestamp }, { getAuth, signInAnonymously }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js'),
  ]);
  const config = {
    apiKey,
    authDomain: 'walletsumilator.firebaseapp.com',
    projectId: 'walletsumilator',
    storageBucket: 'walletsumilator.firebasestorage.app',
    messagingSenderId: '511873754354',
    appId: '1:511873754354:web:8e689553176703cfa59c6b',
    measurementId: 'G-PCYW69HM02',
  };
  const name = 'findom-wallet-shared';
  const app = getApps().find((item) => item.name === name) || initializeApp(config, name);
  if (app.options.apiKey !== apiKey) throw new Error('A configuração do Firebase mudou. Reabra o aplicativo para reconectar.');
  const db = getFirestore(app);
  const auth = getAuth(app);
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  const cipher = await WalletCipher.forCode(code);
  const ref = doc(db, 'walletsCompartilhadas', cipher.room);
  return {
    uid: auth.currentUser.uid,
    path: ref.path,
    watch(receive, fail) {
      let sequence = Promise.resolve(),
        stopped = false;
      const unsubscribe = onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Never bootstrap from an unconfirmed cache miss or an optimistic pending write.
          if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
          sequence = sequence
            .then(async () => {
              const clear = snapshot.exists() ? await cipher.open(snapshot.data()) : null;
              if (!stopped) receive(clear);
            })
            .catch((error) => {
              if (!stopped) fail(error);
            });
        },
        fail,
      );
      return () => {
        stopped = true;
        unsubscribe();
      };
    },
    async transact(change) {
      return runTransaction(db, async (tx) => {
        const snapshot = await tx.get(ref);
        const next = change(snapshot.exists() ? await cipher.open(snapshot.data()) : null);
        tx.set(ref, { ...(await cipher.seal(next)), updatedAt: serverTimestamp() });
        return next;
      });
    },
  };
}
