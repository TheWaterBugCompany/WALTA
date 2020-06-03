module.exports = {
    hyperloop: {
        ios: {
            xcodebuild: {
                scripts: [{
                        name: "Firebase Crashlytics Upload Symbols",
                        shellScript: "${PODS_ROOT}/FirebaseCrashlytics/run",
                        inputPaths: ["\"${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${TARGET_NAME}\"", "\"$(SRCROOT)/$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)\""]
                    }]
                }
        }
    }
};