﻿using UnityEngine;
using System.Collections;

public class PooControl : MonoBehaviour {

	public float lifeTime = 3.5f;
	public float speed = 2f;
	public float rotationSpeedRange = 1500f;
	public Vector3 target;
	public AudioClip[] spawnSounds;
	public ParticleSystem pooSplatParticle;
	public ParticleSystem splashParticle;
	public Sprite[] pooSprites;
	private float rotationSpeed = 0f;
	private bool landed = false;

	public GameObject ripplePrefab;

	private AudioSource audioSource;

	//private Bounds waterBounds;
	private Collider2D waterCollider;


	void Start () {
		Globals.tempShotsFired += 1;

		//not a collider while flying across the screen
		GetComponent<CircleCollider2D> ().enabled = false;

		//pick one of the sprites
		GetComponent<SpriteRenderer> ().sprite = pooSprites[Random.Range(0, pooSprites.Length)];

		audioSource = GetComponent<AudioSource> ();

		//play a sound!
		if (Globals.sound) {
			audioSource.PlayOneShot (spawnSounds [Random.Range (0, spawnSounds.Length)]);
		}

		//destroy at end
		Invoke("Destroy", lifeTime);

		rotationSpeed = Random.Range (0f, rotationSpeedRange) - (rotationSpeedRange / 2f);

		waterCollider = GameObject.Find ("WaterCollider").GetComponent<Collider2D> ();

	}
	
	void Update () {
		//normall not a collider in final resting state
		GetComponent<CircleCollider2D> ().enabled = false;

		if (transform.position != target) {
			transform.Rotate (0, 0, rotationSpeed * Time.deltaTime);
			transform.position = Vector3.MoveTowards (transform.position, target, speed * Time.deltaTime);

			if (transform.position == target && landed == false) {
				//set this after reaching destination, become a collider for a time!
				GetComponent<CircleCollider2D> ().enabled = true;

				GameObject.Find("Main Camera").GetComponent<CameraShake> ().shakeDuration = .20f;
				Instantiate (ripplePrefab);
				landed = true;

				//spawn a splash if it is within the bounds of the water
				if (waterCollider.OverlapPoint (new Vector2 (transform.position.x, transform.position.y))) {
					Instantiate(splashParticle, new Vector3(transform.position.x, transform.position.y, -2f), Quaternion.identity);
				}
			}
		}
	}

	void Destroy(){
		Destroy (this.gameObject);
	}
		
}
