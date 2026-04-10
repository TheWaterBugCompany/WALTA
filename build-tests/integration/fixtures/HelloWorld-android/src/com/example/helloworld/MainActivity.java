package com.example.helloworld;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String TAG = "HelloWorld";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "App started");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);

        TextView label = new TextView(this);
        label.setText("Hello World");
        label.setContentDescription("greeting");
        label.setGravity(Gravity.CENTER);
        layout.addView(label);

        Button button = new Button(this);
        button.setText("Tap Me");
        button.setContentDescription("tapButton");
        button.setOnClickListener(v -> {
            label.setText("Tapped!");
            Log.i(TAG, "Button tapped");
        });
        layout.addView(button);

        setContentView(layout);
    }
}
