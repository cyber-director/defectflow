#!/bin/bash
while true; do
  if [ -f ml/runs/full_train_fast/confusion_matrix.png ]; then
    cp ml/runs/full_train_fast/confusion_matrix.png ~/Desktop/confusion_matrix.png
  fi
  if [ -f ml/runs/full_train_fast/confusion_matrix_normalized.png ]; then
    cp ml/runs/full_train_fast/confusion_matrix_normalized.png ~/Desktop/confusion_matrix_normalized.png
  fi
  sleep 60
done
