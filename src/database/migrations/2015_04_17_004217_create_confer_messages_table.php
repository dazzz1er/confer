<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateConferMessagesTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('confer_messages', function(Blueprint $table)
		{
			$table->increments('id');
			$table->text('body');
			$table->integer('conversation_id')->unsigned();
			$table->integer('sender_id')->unsigned();
			$table->string('type')->default('user_message');
			$table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('confer_messages');
	}

}